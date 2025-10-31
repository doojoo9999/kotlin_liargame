package org.example.kotlin_liargame.domain.nemonemo.v2.repository

import org.example.kotlin_liargame.domain.nemonemo.v2.model.MultiplayerMode
import org.example.kotlin_liargame.domain.nemonemo.v2.model.MultiplayerParticipantEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.MultiplayerParticipantId
import org.example.kotlin_liargame.domain.nemonemo.v2.model.MultiplayerSessionEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.MultiplayerStatus
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant
import java.util.UUID

interface MultiplayerSessionRepository : JpaRepository<MultiplayerSessionEntity, UUID> {
    fun findAllByStatus(status: MultiplayerStatus): List<MultiplayerSessionEntity>
    fun findAllByModeAndStatus(mode: MultiplayerMode, status: MultiplayerStatus): List<MultiplayerSessionEntity>
    fun findAllByCreatedAtAfter(instant: Instant): List<MultiplayerSessionEntity>
}

interface MultiplayerParticipantRepository : JpaRepository<MultiplayerParticipantEntity, MultiplayerParticipantId> {
    fun countByIdSessionId(sessionId: UUID): Int
    fun findAllByIdSessionId(sessionId: UUID): List<MultiplayerParticipantEntity>
}
