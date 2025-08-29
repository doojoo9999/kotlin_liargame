package org.example.kotlin_liargame.domain.chat.controller

import jakarta.servlet.http.HttpSession
import jakarta.validation.Valid
import org.example.kotlin_liargame.domain.chat.dto.request.CompleteSpeechRequest
import org.example.kotlin_liargame.domain.chat.dto.request.GetChatHistoryRequest
import org.example.kotlin_liargame.domain.chat.dto.request.SendChatMessageRequest
import org.example.kotlin_liargame.domain.chat.dto.response.ChatMessageResponse
import org.example.kotlin_liargame.domain.chat.model.enum.ChatMessageType
import org.example.kotlin_liargame.domain.chat.service.ChatService
import org.example.kotlin_liargame.domain.game.service.GameProgressService
import org.springframework.http.ResponseEntity
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/chat")
class ChatController(
    private val chatService: ChatService,
    private val messagingTemplate: SimpMessagingTemplate,
    private val gameProgressService: GameProgressService
) {

    @PostMapping("/send")
    fun sendMessage(
        @Valid @RequestBody request: SendChatMessageRequest,
        session: HttpSession
    ): ResponseEntity<ChatMessageResponse> {
        val response = chatService.sendMessage(request, session)
        messagingTemplate.convertAndSend("/topic/chat.${request.gameNumber}", response)
        return ResponseEntity.ok(response)
    }
    
    @MessageMapping("/chat.send")  // "/send"에서 "/chat.send"로 변경하여 프론트엔드와 일치시킴
    fun handleChatMessage(
        @Valid @Payload request: SendChatMessageRequest,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        try {
            println("[DEBUG] ========== WebSocket Chat Message Debug Start ==========")
            println("[DEBUG] WebSocket chat message received: gameNumber=${request.gameNumber}, content='${request.content}'")
            println("[DEBUG] Request object: $request")
            println("[DEBUG] HeaderAccessor: $headerAccessor")

            // 세션 속성 추출
            val sessionAttributes = headerAccessor.sessionAttributes
            val webSocketSessionId = headerAccessor.sessionId

            println("[DEBUG] Session attributes: ${sessionAttributes?.keys}")
            println("[DEBUG] WebSocket session ID: $webSocketSessionId")

            // ChatService의 실제 로직 사용 (임시 처리 제거)
            val response = chatService.sendMessageViaWebSocket(request, sessionAttributes, webSocketSessionId)

            println("[DEBUG] ChatService response: $response")
            println("[DEBUG] Broadcasting message to /topic/chat.${request.gameNumber}")

            messagingTemplate.convertAndSend("/topic/chat.${request.gameNumber}", response)

            println("[DEBUG] WebSocket chat message sent successfully via ChatService")
            println("[DEBUG] ========== WebSocket Chat Message Debug End ==========")

        } catch (e: Exception) {
            println("[ERROR] ========== WebSocket Chat Error Debug Start ==========")
            println("[ERROR] WebSocket chat error: ${e.message}")
            println("[ERROR] Error type: ${e.javaClass.simpleName}")
            e.printStackTrace()
            println("[ERROR] ========== WebSocket Chat Error Debug End ==========")

            // Send error message back to the client
            val errorMessage = mapOf(
                "error" to true,
                "message" to (e.message ?: "Unknown error occurred"),
                "gameNumber" to request.gameNumber
            )
            messagingTemplate.convertAndSend("/topic/chat.error.${request.gameNumber}", errorMessage)
        }
    }

    @GetMapping("/history")
    fun getChatHistory(
        @RequestParam gameNumber: Int,
        @RequestParam(required = false) type: String?,
        @RequestParam(required = false) round: Int?,
        @RequestParam(required = false, defaultValue = "100") limit: Int
    ): ResponseEntity<List<ChatMessageResponse>> {
        val messageType = type?.let { 
            ChatMessageType.valueOf(it) 
        }
        
        val request = GetChatHistoryRequest(
            gameNumber = gameNumber,
            type = messageType,
            round = round,
            limit = limit
        )
        
        val response = chatService.getChatHistory(request)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/post-round/{gameNumber}")
    fun getPostRoundMessages(
        @PathVariable gameNumber: Int,
        @RequestParam(required = false, defaultValue = "10") limit: Int
    ): ResponseEntity<List<ChatMessageResponse>> {
        val request = GetChatHistoryRequest(
            gameNumber = gameNumber,
            type = ChatMessageType.POST_ROUND,
            limit = limit
        )
        
        val response = chatService.getChatHistory(request)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/speech/complete")
    fun completeSpeech(@RequestBody request: CompleteSpeechRequest, session: HttpSession): ResponseEntity<String> {
        return try {
            val userId = session.getAttribute("userId") as? Long
                ?: return ResponseEntity.status(401).body("Not authenticated")
                
            gameProgressService.markPlayerAsSpoken(request.gameNumber.toInt(), userId)
            ResponseEntity.ok("Speech completed")
            
        } catch (e: Exception) {
            ResponseEntity.badRequest().body("Failed to complete speech: ${e.message}")
        }
    }
}