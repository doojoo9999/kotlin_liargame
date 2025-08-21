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
    
    @MessageMapping("/chat.send")
    fun handleChatMessage(
        @Valid @Payload request: SendChatMessageRequest,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        try {
            println("[DEBUG] WebSocket chat message received: gameNumber=${request.gameNumber}, content='${request.content}'")

            // 세션 액세서의 모든 정보 로깅
            println("[DEBUG] MessageHeaders: ${headerAccessor.messageHeaders.keys}")
            println("[DEBUG] SessionId: ${headerAccessor.sessionId}")
            println("[DEBUG] SessionAttributes: ${headerAccessor.sessionAttributes?.keys}")

            // 다양한 방법으로 사용자 인증 정보 추출 시도
            var sessionAttributes = headerAccessor.sessionAttributes

            // 1. WebSocket 세션 속성에서 직접 userId 추출 시도
            var userId = sessionAttributes?.get("userId") as? Long
            if (userId != null) {
                println("[DEBUG] Found userId in WebSocket session attributes: $userId")
            }

            // 2. HttpSession에서 userId 추출 시도
            if (userId == null) {
                val httpSession = sessionAttributes?.get("HTTP.SESSION") as? HttpSession
                if (httpSession != null) {
                    userId = httpSession.getAttribute("userId") as? Long
                    if (userId != null) {
                        println("[DEBUG] Found userId in HTTP session: $userId")
                        // WebSocket 세션에 userId 저장
                        if (sessionAttributes == null) {
                            sessionAttributes = mutableMapOf()
                            headerAccessor.sessionAttributes = sessionAttributes
                        }
                        sessionAttributes["userId"] = userId
                        
                        // nickname도 함께 저장
                        val nickname = httpSession.getAttribute("nickname") as? String
                        if (nickname != null) {
                            sessionAttributes["nickname"] = nickname
                        }
                    }
                } else {
                    println("[DEBUG] No HTTP session found in WebSocket connection")
                }
            }

            // 3. 세션 속성이 없는 경우 빈 맵으로 초기화
            if (sessionAttributes == null) {
                sessionAttributes = mutableMapOf()
                headerAccessor.sessionAttributes = sessionAttributes
            }

            // 모든 세션 속성 정보 로깅
            sessionAttributes.forEach { (key, value) ->
                println("[DEBUG] Final session attribute: $key = $value")
            }

            // ChatService 호출 (userId가 null이어도 ChatService에서 처리)
            val response = chatService.sendMessageViaWebSocket(request, sessionAttributes, headerAccessor.sessionId)
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