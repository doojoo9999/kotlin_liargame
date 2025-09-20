package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload

data class FinalJudgmentResultResponse(
    val gameNumber: Int,
    val accusedPlayerId: Long,
    val accusedPlayerNickname: String,
    val isKilled: Boolean, // true if player was executed
    val isLiar: Boolean,   // true if the executed/judged player was a liar
    val executionVotes: Int,
    val survivalVotes: Int,
    val totalVotes: Int
) : GameFlowPayload
