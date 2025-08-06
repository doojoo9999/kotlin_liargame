package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.PlayerEntity

data class NextPlayerResponse(
    val gameId: Long,
    val currentSpeaker: PlayerEntity?,
    val remainingPlayers: Int,
    val phase: String
)