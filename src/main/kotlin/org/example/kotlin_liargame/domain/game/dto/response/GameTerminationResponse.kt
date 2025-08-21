package org.example.kotlin_liargame.domain.game.dto.response

import java.time.Instant

data class GameTerminationResponse(
    val gameNumber: Int,
    val terminationType: String,
    val reason: String,
    val timestamp: Instant,
    val success: Boolean
)
