package org.example.kotlin_liargame.domain.nemonemo.v2.dto

import org.example.kotlin_liargame.domain.nemonemo.v2.model.MultiplayerMode
import org.example.kotlin_liargame.domain.nemonemo.v2.model.MultiplayerStatus
import java.time.Instant
import java.util.UUID

data class MultiplayerSessionCreateRequest(
    val mode: MultiplayerMode,
    val puzzleId: UUID,
    val maxParticipants: Int = 4,
    val privacy: SessionPrivacy = SessionPrivacy.PUBLIC,
    val password: String? = null
)

enum class SessionPrivacy {
    PUBLIC,
    PRIVATE
}

data class MultiplayerSessionDto(
    val sessionId: UUID,
    val mode: MultiplayerMode,
    val status: MultiplayerStatus,
    val hostKey: UUID,
    val puzzleId: UUID,
    val participants: List<MultiplayerParticipantDto>,
    val websocketEndpoint: String,
    val createdAt: Instant,
    val startedAt: Instant?,
    val finishedAt: Instant?
)

data class MultiplayerParticipantDto(
    val subjectKey: UUID,
    val nickname: String?,
    val ready: Boolean,
    val score: Int?,
    val finishTimeMs: Long?,
    val disconnected: Boolean
)

data class MultiplayerJoinResponse(
    val session: MultiplayerSessionDto,
    val token: String
)
