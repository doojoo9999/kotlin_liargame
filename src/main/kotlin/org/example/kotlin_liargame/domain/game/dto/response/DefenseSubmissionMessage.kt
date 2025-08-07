package org.example.kotlin_liargame.domain.game.dto.response

import java.time.Instant

data class DefenseSubmissionMessage(
    val gameNumber: Int,
    val playerId: Long,
    val playerNickname: String,
    val defenseText: String,
    val timestamp: Instant
)