package org.example.kotlin_liargame.domain.game.dto.response

data class FinalVoteResponse(
    val gameNumber: Int,
    val voterPlayerId: Long,
    val voterNickname: String,
    val voteForExecution: Boolean,
    val success: Boolean,
    val message: String? = null
)