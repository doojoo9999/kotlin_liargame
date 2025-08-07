package org.example.kotlin_liargame.domain.game.dto.response

data class VoteResponse(
    val voterNickname: String,
    val targetNickname: String,
    val success: Boolean,
    val message: String? = null
)