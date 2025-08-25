package org.example.kotlin_liargame.domain.game.dto

import java.time.Instant

data class StatusMessage(
    val content: String,
    val timestamp: Instant
)