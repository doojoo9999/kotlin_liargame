package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload

data class FinalVotingStartResponse(
    val gameNumber: Int,
    val accusedPlayerId: Long,
    val accusedPlayerNickname: String,
    val defenseText: String,
    val votingTimeLimit: Int,
    val success: Boolean
) : GameFlowPayload
