package org.example.kotlin_liargame.domain.game.dto.response

data class CountdownUpdateResponse(
    val gameNumber: Int,
    val remainingTime: Int,
    val phase: String
)