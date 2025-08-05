package org.example.kotlin_liargame.domain.chat.controller

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.chat.dto.request.GetChatHistoryRequest
import org.example.kotlin_liargame.domain.chat.dto.request.SendChatMessageRequest
import org.example.kotlin_liargame.domain.chat.dto.response.ChatMessageResponse
import org.example.kotlin_liargame.domain.chat.model.enum.ChatMessageType
import org.example.kotlin_liargame.domain.chat.service.ChatService
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
    private val messagingTemplate: SimpMessagingTemplate
) {

    @PostMapping("/send")
    fun sendMessage(
        @RequestBody request: SendChatMessageRequest,
        session: HttpSession
    ): ResponseEntity<ChatMessageResponse> {
        val response = chatService.sendMessage(request, session)
        messagingTemplate.convertAndSend("/topic/chat.${request.gameNumber}", response)
        return ResponseEntity.ok(response)
    }
    
    @MessageMapping("/chat.send")
    fun handleChatMessage(
        @Payload request: SendChatMessageRequest,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        try {
            println("[DEBUG] WebSocket chat message received: gameNumber=${request.gameNumber}, content='${request.content}'")

            // 세션 액세서의 모든 정보 로깅
            println("[DEBUG] MessageHeaders: ${headerAccessor.messageHeaders.keys}")
            println("[DEBUG] SessionId: ${headerAccessor.sessionId}")
            println("[DEBUG] SessionAttributes: ${headerAccessor.sessionAttributes?.keys}")

            // HttpSession 가져오기 시도
            val httpSession = headerAccessor.sessionAttributes?.get("HTTP.SESSION") as? jakarta.servlet.http.HttpSession
            println("[DEBUG] HttpSession present: ${httpSession != null}")

            // WebSocket 세션에서 직접 userId 가져오기 시도
            val sessionAttributes = headerAccessor.sessionAttributes

            // 모든 세션 속성 정보 로깅
            sessionAttributes?.forEach { (key, value) ->
                println("[DEBUG] Session attribute: $key = $value")
            }

            // HttpSession을 통한 인증 시도
            if (httpSession != null) {
                val userId = httpSession.getAttribute("userId") as? Long
                if (userId != null) {
                    println("[DEBUG] Found userId in HTTP session: $userId")
                    // HTTP 세션에서 발견된 userId를 WebSocket 세션에 저장
                    if (sessionAttributes != null) {
                        sessionAttributes["userId"] = userId
                    }
                }
            }

            // 세션 없을 경우 예외 발생
            if (sessionAttributes == null) {
                throw RuntimeException("No session found")
            }
            
            val response = chatService.sendMessageViaWebSocket(request, sessionAttributes)
            messagingTemplate.convertAndSend("/topic/chat.${request.gameNumber}", response)
            
            println("[DEBUG] WebSocket chat message sent successfully")
            
        } catch (e: Exception) {
            println("[ERROR] WebSocket chat error: ${e.message}")
            e.printStackTrace()
            
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
        @RequestParam(required = false, defaultValue = "50") limit: Int
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
}