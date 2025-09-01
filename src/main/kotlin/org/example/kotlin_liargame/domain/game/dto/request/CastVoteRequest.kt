package org.example.kotlin_liargame.domain.game.dto.request

data class CastVoteRequest(
    val gameNumber: Int,
    val targetUserId: Long
)