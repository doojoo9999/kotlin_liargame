package org.example.kotlin_liargame.domain.game.dto.response

import java.time.Instant

data class GamePhaseMessage(
    val phase: String,
    val timestamp: Instant,
    val additionalData: Map<String, Any>? = null
)