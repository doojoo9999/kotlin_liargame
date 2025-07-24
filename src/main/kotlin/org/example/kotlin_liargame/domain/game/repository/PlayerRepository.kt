package org.example.kotlin_liargame.domain.game.repository

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.springframework.data.jpa.repository.JpaRepository

interface PlayerRepository : JpaRepository<PlayerEntity, Long> {
    
    fun findByGame(game: GameEntity): List<PlayerEntity>
    
    fun findByGameAndUserId(game: GameEntity, userId: Long): PlayerEntity?
    
    fun countByGame(game: GameEntity): Int
    
    fun findByGameAndIsAlive(game: GameEntity, isAlive: Boolean): List<PlayerEntity>
}