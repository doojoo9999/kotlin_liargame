package org.example.kotlin_liargame.domain.chat.repository

import org.example.kotlin_liargame.domain.chat.model.ChatMessageEntity
import org.example.kotlin_liargame.domain.chat.model.enum.ChatMessageType
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
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

    // 플레이어별 채팅 메시지 삭제를 위한 메서드 추가
    @Modifying
    @Query("DELETE FROM ChatMessageEntity c WHERE c.player.userId = :userId")
    fun deleteByPlayerUserId(@Param("userId") userId: Long): Int

    // Fetch IDs for batched deletion to avoid long-running locks
    @Query("SELECT c.id FROM ChatMessageEntity c WHERE c.player.userId = :userId")
    fun findIdsByPlayerUserId(@Param("userId") userId: Long): List<Long>

    @Modifying
    @Query("DELETE FROM ChatMessageEntity c WHERE c.game = :game")
    fun deleteByGame(@Param("game") game: GameEntity): Int

    // 특정 플레이어의 특정 타입 메시지 중 가장 최근 메시지 조회
    fun findTopByGameAndPlayerAndTypeOrderByTimestampDesc(
        game: GameEntity,
        player: org.example.kotlin_liargame.domain.game.model.PlayerEntity,
        type: ChatMessageType
    ): ChatMessageEntity?
}
