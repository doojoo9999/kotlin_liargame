package org.example.kotlin_liargame.domain.game.repository

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface GameRepository : JpaRepository<GameEntity, Long> {

    fun findBygOwner(gOwner: String) : GameEntity?
    @Query("SELECT g FROM GameEntity g WHERE g.gNumber = :gNumber")
    fun findBygNumber(gNumber: Int) : GameEntity?

    @Query("SELECT g FROM GameEntity g WHERE g.gState != :gState")
    fun findByGStateNot(gState: GameState): List<GameEntity>

    @Query("SELECT g FROM GameEntity g WHERE g.gState IN ('WAITING', 'IN_PROGRESS')")
    fun findAllActiveGames(): List<GameEntity>
}
