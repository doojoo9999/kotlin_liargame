package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload

data class GameStatistics(
    val totalRounds: Int,
    val currentRound: Int,
    val totalDuration: Long, // 초 단위
    val averageRoundDuration: Long,
    val totalVotes: Int,
    val correctGuesses: Int
) : GameFlowPayload
