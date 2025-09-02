package org.example.kotlin_liargame.domain.chat.service

import org.example.kotlin_liargame.domain.chat.dto.response.ChatMessageResponse
import org.example.kotlin_liargame.domain.chat.model.ChatMessageEntity
import org.example.kotlin_liargame.domain.chat.model.enum.ChatMessageType
import org.example.kotlin_liargame.domain.chat.repository.ChatMessageRepository
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * 시스템/브로드캐스트 전송 책임 전담.
 */
@Component
class ChatSystemMessenger(
    private val chatMessageRepository: ChatMessageRepository,
    private val messagingTemplate: SimpMessagingTemplate
) {
    @Transactional
    fun sendSystemMessage(game: GameEntity, message: String) {
        val systemMessage = ChatMessageEntity(
            game = game,
            player = null,
            content = message,
            type = ChatMessageType.SYSTEM
        )
        val saved = chatMessageRepository.save(systemMessage)
        broadcast(saved)
    }

    fun broadcast(entity: ChatMessageEntity) {
        val response = ChatMessageResponse.from(entity)
        messagingTemplate.convertAndSend("/topic/chat.${entity.game.gameNumber}", response)
    }
}

