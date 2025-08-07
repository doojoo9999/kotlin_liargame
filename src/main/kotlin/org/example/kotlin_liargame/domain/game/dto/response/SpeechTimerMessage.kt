package org.example.kotlin_liargame.domain.game.dto.response

import java.time.Instant

data class SpeechTimerMessage(
    val playerId: Long,
    val remainingTime: Int,
    val timestamp: Instant
)