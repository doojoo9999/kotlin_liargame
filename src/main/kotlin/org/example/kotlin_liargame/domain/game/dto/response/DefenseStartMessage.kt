package org.example.kotlin_liargame.domain.game.dto.response

import java.time.Instant

data class DefenseStartMessage(
    val gameNumber: Int,
    val accusedPlayerId: Long,
    val accusedPlayerNickname: String,
    val defenseTimeLimit: Int,
    val timestamp: Instant
)