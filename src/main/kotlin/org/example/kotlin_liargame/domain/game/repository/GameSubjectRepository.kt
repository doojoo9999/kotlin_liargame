package org.example.kotlin_liargame.domain.game.repository

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.GameSubjectEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface GameSubjectRepository : JpaRepository<GameSubjectEntity, Long> {
    
    fun findByGame(game: GameEntity): List<GameSubjectEntity>
    
    @Query("SELECT gs FROM GameSubjectEntity gs JOIN FETCH gs.subject WHERE gs.game = :game")
    fun findByGameWithSubject(@Param("game") game: GameEntity): List<GameSubjectEntity>
}