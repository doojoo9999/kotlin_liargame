package org.example.kotlin_liargame.domain.chat.repository

import org.example.kotlin_liargame.domain.chat.model.ChatMessageEntity
import org.example.kotlin_liargame.domain.chat.model.ChatMessageType
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
interface ChatMessageRepository : JpaRepository<ChatMessageEntity, Long> {
    fun findByGame(game: GameEntity): List<ChatMessageEntity>

    fun findByGameAndType(game: GameEntity, type: ChatMessageType): List<ChatMessageEntity>

    fun findByGameAndTimestampAfter(game: GameEntity, timestamp: Instant): List<ChatMessageEntity>

    fun findByGameAndTypeAndTimestampAfter(game: GameEntity, type: ChatMessageType, timestamp: Instant): List<ChatMessageEntity>

    fun findByGameAndGameGCurrentRound(game: GameEntity, round: Int): List<ChatMessageEntity>
}