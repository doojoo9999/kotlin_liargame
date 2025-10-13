package org.example.kotlin_liargame.domain.chat.dto.response

import org.example.kotlin_liargame.domain.chat.model.ChatMessageEntity
import org.example.kotlin_liargame.domain.chat.model.enum.ChatMessageType
import java.time.Instant

data class ChatMessageResponse(
    val id: Long?,
    val gameNumber: Int,
    val playerNickname: String?, // 시스템 메시지의 경우 null
    val playerUserId: Long?,
    val content: String,
    val timestamp: Instant,
    val type: ChatMessageType
) {
    companion object {
        fun from(entity: ChatMessageEntity): ChatMessageResponse {
            return ChatMessageResponse(
                id = entity.id,
                gameNumber = entity.game.gameNumber,
                playerNickname = entity.playerNicknameSnapshot ?: entity.player?.nickname, // 시스템 메시지의 경우 null
                playerUserId = entity.playerUserId ?: entity.player?.userId,
                content = entity.content,
                timestamp = entity.timestamp,
                type = entity.type
            )
        }
    }
}
