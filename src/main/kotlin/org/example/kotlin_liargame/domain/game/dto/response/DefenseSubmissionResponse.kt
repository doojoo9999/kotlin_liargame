package org.example.kotlin_liargame.domain.game.dto.response

data class DefenseSubmissionResponse(
    val gameNumber: Int,
    val playerId: Long,
    val playerNickname: String,
    val defenseText: String,
    val success: Boolean,
    val message: String? = null
)