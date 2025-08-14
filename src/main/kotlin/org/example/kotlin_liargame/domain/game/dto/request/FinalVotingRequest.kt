package org.example.kotlin_liargame.domain.game.dto.request

import jakarta.validation.constraints.Positive

data class FinalVotingRequest(
    @field:Positive(message = "투표자 ID는 양수여야 합니다")
    val voterPlayerId: Long,
    val voteForExecution: Boolean
)