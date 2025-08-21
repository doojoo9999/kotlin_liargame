package org.example.kotlin_liargame.domain.auth.dto.response

data class AdminStatsResponse(
    val totalPlayers: Int,
    val activeGames: Int,
    val totalGames: Int,
    val playersInLobby: Int
)
