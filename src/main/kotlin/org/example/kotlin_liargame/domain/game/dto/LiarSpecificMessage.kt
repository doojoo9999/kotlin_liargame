package org.example.kotlin_liargame.domain.game.dto

import java.time.Instant

data class LiarSpecificMessage(
    val content: String,
    val timestamp: Instant,
    val showInput: Boolean
)
