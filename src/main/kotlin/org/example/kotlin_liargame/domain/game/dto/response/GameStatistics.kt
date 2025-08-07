package org.example.kotlin_liargame.domain.game.dto.response

data class GameStatistics(
    val totalRounds: Int,
    val currentRound: Int,
    val totalDuration: Long, // 초 단위
    val averageRoundDuration: Long,
    val totalVotes: Int,
    val correctGuesses: Int
)