package org.example.kotlin_liargame.domain.chat.repository

import org.example.kotlin_liargame.domain.chat.model.ChatMessageEntity
import org.example.kotlin_liargame.domain.chat.model.enum.ChatMessageType
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
interface ChatMessageRepository : JpaRepository<ChatMessageEntity, Long> {
    fun findByGame(game: GameEntity): List<ChatMessageEntity>

    fun findByGameAndType(game: GameEntity, type: ChatMessageType): List<ChatMessageEntity>

    fun findByGameAndTimestampAfter(game: GameEntity, timestamp: Instant): List<ChatMessageEntity>

    fun findByGameAndTypeAndTimestampAfter(game: GameEntity, type: ChatMessageType, timestamp: Instant): List<ChatMessageEntity>

    @Query("SELECT c FROM ChatMessageEntity c WHERE c.game = :game AND c.game.gameCurrentRound = :round")
    fun findByGameAndGameCurrentRound(@Param("game") game: GameEntity, @Param("round") round: Int): List<ChatMessageEntity>
}
