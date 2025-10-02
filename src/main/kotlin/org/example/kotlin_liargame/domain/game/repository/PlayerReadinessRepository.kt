package org.example.kotlin_liargame.domain.game.repository

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerReadinessEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface PlayerReadinessRepository : JpaRepository<PlayerReadinessEntity, Long> {
    fun findByGame(game: GameEntity): List<PlayerReadinessEntity>
    fun findByGameAndUserId(game: GameEntity, userId: Long): PlayerReadinessEntity?
    fun deleteByGame(game: GameEntity)
    fun countByGameAndIsReady(game: GameEntity, isReady: Boolean): Int

    @Modifying
    @Query("DELETE FROM PlayerReadinessEntity pr WHERE pr.game = :game AND pr.userId = :userId")
    fun deleteByGameAndUserId(
        @Param("game") game: GameEntity,
        @Param("userId") userId: Long
    ): Int
}
