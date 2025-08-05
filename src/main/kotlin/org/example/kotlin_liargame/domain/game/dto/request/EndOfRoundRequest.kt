package org.example.kotlin_liargame.domain.game.dto.request

data class EndOfRoundRequest(
    val gameNumber: Int,
    val gameOwner: String,
    val gameRound: Int,
    val gameLiar: String,
    val gameWinner: String,
    val isGameOver: Boolean,
)

