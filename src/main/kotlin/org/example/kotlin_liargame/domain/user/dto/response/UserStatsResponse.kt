package org.example.kotlin_liargame.domain.user.dto.response

data class UserStatsResponse(
    val userId: Long,
    val nickname: String,
    val totalGames: Int,
    val wins: Int,
    val losses: Int,
    val winRate: Double,
    val liarPlays: Int,
    val citizenPlays: Int
)
