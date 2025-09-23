package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameRealtimePayload
import java.time.Instant

data class DefenseSubmissionMessage(
    val gameNumber: Int,
    val userId: Long,
    val playerNickname: String,
    val defenseText: String,
    val timestamp: Instant
) : GameRealtimePayload
