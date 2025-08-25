package org.example.kotlin_liargame.domain.game.dto

import java.time.Instant

data class EnhancedLiarGuessStatus(
    val liarPlayerId: Long,
    val guessTimeLimit: Int,
    val startTime: Instant,
    var remainingTime: Int,
    var guessSubmitted: Boolean = false,
    var guessText: String? = null,
    var isCorrect: Boolean = false,
    var timedOut: Boolean = false
)