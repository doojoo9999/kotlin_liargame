package org.example.kotlin_liargame.domain.game.repository

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface GameRepository : JpaRepository<GameEntity, Long> {

    fun findBygOwner(gOwner: String) : GameEntity?

    fun findBygNumber(gNumber: Int) : GameEntity?
    
    @Query("SELECT g FROM GameEntity g WHERE g.gState = org.example.kotlin_liargame.domain.game.model.enum.GameState.WAITING OR g.gState = org.example.kotlin_liargame.domain.game.model.enum.GameState.IN_PROGRESS")
    fun findAllActiveGames(): List<GameEntity>
}