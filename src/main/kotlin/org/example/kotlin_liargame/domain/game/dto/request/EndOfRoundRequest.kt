package org.example.kotlin_liargame.domain.game.dto.request

data class EndOfRoundRequest(
    val gNumber: Int,
    val gOwner: String,
    val gRound: Int,
    val gLiar: String,
    val gWinner: String,
    val gIsGameOver: Boolean,
)
