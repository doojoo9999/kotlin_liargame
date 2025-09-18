package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameRealtimePayload
import java.time.Instant

data class DefenseTimeoutMessage(
    val gameNumber: Int,
    val accusedPlayerId: Long,
    val accusedPlayerNickname: String,
    val timestamp: Instant
) : GameRealtimePayload
