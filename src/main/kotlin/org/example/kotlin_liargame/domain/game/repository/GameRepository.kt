package org.example.kotlin_liargame.domain.game.repository

import jakarta.persistence.LockModeType
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query

interface GameRepository : JpaRepository<GameEntity, Long> {

    fun findByGameOwner(gameOwner: String) : GameEntity?
    
    @Query("SELECT g FROM GameEntity g WHERE g.gameNumber = :gameNumber")
    fun findByGameNumber(gameNumber: Int) : GameEntity?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT g FROM GameEntity g WHERE g.gameNumber = :gameNumber")
    fun findByGameNumberWithLock(gameNumber: Int): GameEntity?

    @Query("SELECT g FROM GameEntity g WHERE g.gameState != :gameState")
    fun findByGameStateNot(gameState: GameState): List<GameEntity>

    @Query("SELECT g FROM GameEntity g WHERE g.gameState IN ('WAITING', 'IN_PROGRESS')")
    fun findAllActiveGames(): List<GameEntity>

    fun findByGameState(gameState: GameState): List<GameEntity>

    @Query("SELECT g FROM GameEntity g WHERE g.gameState = 'WAITING' AND g.createdAt < :time")
    fun findStaleWaitingGames(time: java.time.Instant): List<GameEntity>

    fun findByGameOwnerAndGameStateIn(owner: String, states: List<GameState>): GameEntity?
}