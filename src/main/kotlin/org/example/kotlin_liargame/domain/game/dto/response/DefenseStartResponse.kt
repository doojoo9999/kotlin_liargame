package org.example.kotlin_liargame.domain.game.dto.response

data class DefenseStartResponse(
    val gameNumber: Int,
    val accusedPlayerId: Long,
    val accusedPlayerNickname: String,
    val defenseTimeLimit: Int,
    val success: Boolean
)