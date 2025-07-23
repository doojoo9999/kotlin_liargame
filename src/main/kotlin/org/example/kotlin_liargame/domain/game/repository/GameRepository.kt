package org.example.kotlin_liargame.domain.game.repository

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.springframework.data.jpa.repository.JpaRepository

interface GameRepository : JpaRepository<GameEntity, Long> {

    fun findBygOwner(gOwner: String) : GameEntity?

    fun findBygNumber(gNumber: Int) : GameEntity?

}