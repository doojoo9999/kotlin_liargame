package org.example.kotlin_liargame.tools.websocket.dto

import java.time.Instant

data class PlayerVotedEvent(
    val type: String = "PLAYER_VOTED",
    val gameNumber: Int,
    val voterId: Long,
    val targetId: Long,
    val timestamp: Instant = Instant.now()
)

data class HintSubmittedEvent(
    val type: String = "HINT_SUBMITTED",
    val gameNumber: Int,
    val userId: Long,
    val hint: String,
    val timestamp: Instant = Instant.now()
)

data class TurnChangedEvent(
    val type: String = "TURN_CHANGED",
    val gameNumber: Int,
    val currentPlayerId: Long,
    val turnStartedAt: Instant,
    val turnTimeoutSeconds: Long,
    val phaseEndTime: Instant?,
    val timestamp: Instant = Instant.now()
)
