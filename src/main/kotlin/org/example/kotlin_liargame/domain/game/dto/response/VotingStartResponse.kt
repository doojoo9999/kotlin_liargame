package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.PlayerEntity

data class VotingStartResponse(
    val gameNumber: Int,
    val players: List<PlayerEntity>,
    val votingTimeLimit: Int
)