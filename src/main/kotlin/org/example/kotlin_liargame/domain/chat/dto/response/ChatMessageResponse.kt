package org.example.kotlin_liargame.domain.chat.dto.response

import org.example.kotlin_liargame.domain.chat.model.ChatMessageEntity
import org.example.kotlin_liargame.domain.chat.model.ChatMessageType
import java.time.Instant

data class ChatMessageResponse(
    val id: Long,
    val playerId: Long,
    val playerNickname: String,
    val content: String,
    val timestamp: Instant,
    val type: ChatMessageType
) {
    companion object {
        fun from(chatMessage: ChatMessageEntity): ChatMessageResponse {
            return ChatMessageResponse(
                id = chatMessage.id,
                playerId = chatMessage.player.id,
                playerNickname = chatMessage.player.nickname,
                content = chatMessage.content,
                timestamp = chatMessage.timestamp,
                type = chatMessage.type
            )
        }
    }
}
