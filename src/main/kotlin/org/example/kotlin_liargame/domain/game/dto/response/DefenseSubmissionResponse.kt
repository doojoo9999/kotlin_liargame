package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload

data class DefenseSubmissionResponse(
    val gameNumber: Int,
    val userId: Long,
    val playerNickname: String,
    val defenseText: String,
    val success: Boolean,
    val message: String? = null
) : GameFlowPayload
