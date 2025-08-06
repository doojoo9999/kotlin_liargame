package org.example.kotlin_liargame.domain.game.dto.response

import java.time.Instant

data class CurrentTurnMessage(
    val currentSpeakerId: Long,
    val timestamp: Instant
)