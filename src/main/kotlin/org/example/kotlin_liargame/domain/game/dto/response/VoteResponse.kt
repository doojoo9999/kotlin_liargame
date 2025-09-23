package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload

data class VoteResponse(
    val voterNickname: String,
    val targetNickname: String,
    val success: Boolean,
    val message: String? = null
) : GameFlowPayload
