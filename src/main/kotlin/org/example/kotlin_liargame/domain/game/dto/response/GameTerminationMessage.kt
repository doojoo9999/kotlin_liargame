package org.example.kotlin_liargame.domain.game.dto.response

import java.time.Instant

data class GameTerminationMessage(
    val gameNumber: Int,
    val message: String,
    val timestamp: Instant,
    val reason: String
)
