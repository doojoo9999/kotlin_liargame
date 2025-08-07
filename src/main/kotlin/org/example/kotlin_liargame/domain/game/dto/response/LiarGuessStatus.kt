package org.example.kotlin_liargame.domain.game.dto.response

import java.time.Instant

data class LiarGuessStatus(
    val liarPlayerId: Long,
    val guessTimeLimit: Int,
    val startTime: Instant,
    var guessSubmitted: Boolean = false,
    var guessText: String? = null
)