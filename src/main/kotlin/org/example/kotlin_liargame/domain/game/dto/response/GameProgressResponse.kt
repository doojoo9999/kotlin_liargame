package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.PlayerEntity

data class GameProgressResponse(
    val gameId: Long,
    val currentSpeaker: PlayerEntity,
    val playerOrder: List<PlayerEntity>,
    val phase: String
)