package org.example.kotlin_liargame.domain.game.dto.request

import jakarta.validation.constraints.Positive

data class CastFinalJudgmentRequest(
    @field:Positive(message = "게임 번호는 양수여야 합니다")
    val gameNumber: Int,
    val voteForExecution: Boolean // true = 처형, false = 생존
)