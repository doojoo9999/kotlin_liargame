package org.example.kotlin_liargame.domain.game.dto.response

data class VotingResultResponse(
    val gameNumber: Int,
    val voteResults: Map<Long, Int>, // playerId -> voteCount
    val accusedPlayerId: Long?,
    val isTie: Boolean,
    val needRevote: Boolean
)