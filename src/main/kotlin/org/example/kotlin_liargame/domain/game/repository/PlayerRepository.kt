package org.example.kotlin_liargame.domain.game.repository

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query

interface PlayerRepository : JpaRepository<PlayerEntity, Long> {
    
    fun findByGame(game: GameEntity): List<PlayerEntity>
    
    fun findByGameAndUserId(game: GameEntity, userId: Long): PlayerEntity?
    
    fun findByNickname(nickname: String): PlayerEntity?

    fun countByGame(game: GameEntity): Int
    
    fun findByGameAndIsAlive(game: GameEntity, isAlive: Boolean): List<PlayerEntity>

    @Query("SELECT COUNT(p) FROM PlayerEntity p WHERE p.game.id = :gameId")
    fun countByGameId(gameId: Long): Int

    @Query("DELETE FROM PlayerEntity p WHERE p.game.id = :gameId AND p.userId = :userId")
    @Modifying
    fun deleteByGameIdAndUserId(gameId: Long, userId: Long): Int

    @Query("SELECT p FROM PlayerEntity p WHERE p.userId = :userId AND p.game.gameState = 'IN_PROGRESS'")
    fun findByUserIdAndGameInProgress(userId: Long): PlayerEntity?

    // 플레이어 상태별 조회 및 개수
    fun findByState(state: org.example.kotlin_liargame.domain.game.model.enum.PlayerState): List<PlayerEntity>

    fun countByState(state: org.example.kotlin_liargame.domain.game.model.enum.PlayerState): Long

    fun countByStateNot(state: org.example.kotlin_liargame.domain.game.model.enum.PlayerState): Long

    // 게임별 플레이어 삭제
    @Query("DELETE FROM PlayerEntity p WHERE p.game = :game")
    @Modifying
    fun deleteByGame(game: GameEntity): Int
}