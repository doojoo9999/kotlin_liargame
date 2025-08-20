package org.example.kotlin_liargame.domain.game.repository

import org.example.kotlin_liargame.domain.game.model.GameHistory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface GameHistoryRepository : JpaRepository<GameHistory, Long> {
    @Query("SELECT h FROM GameHistory h WHERE :nickname MEMBER OF h.participants")
    fun findByParticipantNickname(nickname: String): List<GameHistory>
}
