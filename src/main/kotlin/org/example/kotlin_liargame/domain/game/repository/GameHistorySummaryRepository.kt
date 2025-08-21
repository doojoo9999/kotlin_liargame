package org.example.kotlin_liargame.domain.game.repository

import org.example.kotlin_liargame.domain.game.model.GameHistorySummaryEntity
import org.springframework.data.jpa.repository.JpaRepository

interface GameHistorySummaryRepository : JpaRepository<GameHistorySummaryEntity, Long> {
    fun findTopByParticipantsContainsOrderByCreatedAtDesc(nickname: String): GameHistorySummaryEntity?
}
