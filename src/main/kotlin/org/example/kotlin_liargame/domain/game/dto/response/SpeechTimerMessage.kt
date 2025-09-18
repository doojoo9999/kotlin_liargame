package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameRealtimePayload
import java.time.Instant

data class SpeechTimerMessage(
    val userId: Long,
    val remainingTime: Int,
    val timestamp: Instant
) : GameRealtimePayload
