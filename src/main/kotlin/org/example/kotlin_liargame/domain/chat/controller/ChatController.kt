package org.example.kotlin_liargame.domain.chat.controller

import org.example.kotlin_liargame.domain.chat.dto.request.GetChatHistoryRequest
import org.example.kotlin_liargame.domain.chat.dto.request.SendChatMessageRequest
import org.example.kotlin_liargame.domain.chat.dto.response.ChatMessageResponse
import org.example.kotlin_liargame.domain.chat.model.ChatMessageType
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
    fun sendMessage(@RequestBody request: SendChatMessageRequest): ResponseEntity<ChatMessageResponse> {
        val response = chatService.sendMessage(request)
        
        messagingTemplate.convertAndSend("/topic/chat.${request.gNumber}", response)
        
        return ResponseEntity.ok(response)
    }
    
    @MessageMapping("/chat.send")
    fun handleChatMessage(
        @Payload request: SendChatMessageRequest,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        try {
            println("[DEBUG] Received WebSocket chat message: $request")
            
            val sessionAttributes = headerAccessor.sessionAttributes
            val sessionUserId = sessionAttributes?.get("userId") as? Long
            val sessionToken = sessionAttributes?.get("token") as? String
            println("[DEBUG] Session userId: $sessionUserId, token present: ${sessionToken != null}")
            
            val response = chatService.sendMessageWithJwtAuth(request, sessionUserId, sessionToken)
            
            val topic = "/topic/chat.${request.gNumber}"
            messagingTemplate.convertAndSend(topic, response)
            
            println("[DEBUG] Broadcasting chat message to $topic: $response")
            println("[SUCCESS] WebSocket chat message processed successfully")
            
        } catch (e: Exception) {
            println("[ERROR] Failed to handle WebSocket chat message: ${e.message}")
            e.printStackTrace()
        }
    }

    @GetMapping("/history")
    fun getChatHistory(
        @RequestParam gNumber: Int,
        @RequestParam(required = false) type: String?,
        @RequestParam(required = false) round: Int?,
        @RequestParam(required = false, defaultValue = "50") limit: Int
    ): ResponseEntity<List<ChatMessageResponse>> {
        val messageType = type?.let { 
            ChatMessageType.valueOf(it) 
        }
        
        val request = GetChatHistoryRequest(
            gNumber = gNumber,
            type = messageType,
            round = round,
            limit = limit
        )
        
        val response = chatService.getChatHistory(request)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/post-round/{gNumber}")
    fun getPostRoundMessages(
        @PathVariable gNumber: Int,
        @RequestParam(required = false, defaultValue = "10") limit: Int
    ): ResponseEntity<List<ChatMessageResponse>> {
        val request = GetChatHistoryRequest(
            gNumber = gNumber,
            type = ChatMessageType.POST_ROUND,
            limit = limit
        )
        
        val response = chatService.getChatHistory(request)
        return ResponseEntity.ok(response)
    }
}