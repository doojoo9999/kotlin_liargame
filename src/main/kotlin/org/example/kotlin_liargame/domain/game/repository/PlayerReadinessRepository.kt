package org.example.kotlin_liargame.domain.game.repository

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerReadinessEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PlayerReadinessRepository : JpaRepository<PlayerReadinessEntity, Long> {
    fun findByGame(game: GameEntity): List<PlayerReadinessEntity>
    fun findByGameAndUserId(game: GameEntity, userId: Long): PlayerReadinessEntity?
    fun deleteByGame(game: GameEntity)
    fun countByGameAndIsReady(game: GameEntity, isReady: Boolean): Int
}

