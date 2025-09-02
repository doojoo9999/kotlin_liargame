package org.example.kotlin_liargame.domain.chat.controller

import jakarta.servlet.http.HttpSession
import jakarta.validation.Valid
import org.example.kotlin_liargame.domain.chat.dto.request.CompleteSpeechRequest
import org.example.kotlin_liargame.domain.chat.dto.request.GetChatHistoryRequest
import org.example.kotlin_liargame.domain.chat.dto.request.SendChatMessageRequest
import org.example.kotlin_liargame.domain.chat.dto.response.ChatMessageResponse
import org.example.kotlin_liargame.domain.chat.model.enum.ChatMessageType
import org.example.kotlin_liargame.domain.chat.service.ChatCommandService
import org.example.kotlin_liargame.domain.chat.service.ChatService
import org.example.kotlin_liargame.domain.game.service.GameProgressService
import org.example.kotlin_liargame.global.util.SessionUtil
import org.springframework.http.ResponseEntity
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/chat")
class ChatController(
    private val chatService: ChatService, // 히스토리/시스템 메시지 등 기존 기능 유지
    private val chatCommandService: ChatCommandService,
    private val gameProgressService: GameProgressService,
    private val sessionUtil: SessionUtil
) {

    @PostMapping("/send")
    fun sendMessage(
        @Valid @RequestBody request: SendChatMessageRequest,
        session: HttpSession
    ): ResponseEntity<ChatMessageResponse> {
        val userId = sessionUtil.getUserId(session) ?: return ResponseEntity.status(401).build()
        val response = chatCommandService.handleSend(userId, request)
        return ResponseEntity.ok(response)
    }

    @MessageMapping("/chat.send")
    fun handleChatMessage(
        @Valid @Payload request: SendChatMessageRequest,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        val userId = headerAccessor.sessionAttributes?.get("userId") as? Long
            ?: throw RuntimeException("Not authenticated via WebSocket")
        chatCommandService.handleSend(userId, request)
    }

    @GetMapping("/history")
    fun getChatHistory(
        @RequestParam gameNumber: Int,
        @RequestParam(required = false) type: String?,
        @RequestParam(required = false) round: Int?,
        @RequestParam(required = false, defaultValue = "100") limit: Int
    ): ResponseEntity<List<ChatMessageResponse>> {
        val messageType = type?.let { ChatMessageType.valueOf(it) }
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
            val userId = sessionUtil.getUserId(session)
                ?: return ResponseEntity.status(401).body("Not authenticated")
            gameProgressService.markPlayerAsSpoken(request.gameNumber.toInt(), userId)
            ResponseEntity.ok("Speech completed")
        } catch (e: Exception) {
            ResponseEntity.badRequest().body("Failed to complete speech: ${e.message}")
        }
    }
}