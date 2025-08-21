package org.example.kotlin_liargame.domain.auth.dto.response

data class AdminGameInfo(
    val gameNumber: Int,
    val gameName: String,
    val gameState: String,
    val currentPlayerCount: Int,
    val maxPlayerCount: Int,
    val players: List<AdminPlayerInfo>
)
