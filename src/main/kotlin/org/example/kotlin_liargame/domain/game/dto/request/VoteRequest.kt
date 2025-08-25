package org.example.kotlin_liargame.domain.game.dto.request

import jakarta.validation.constraints.Positive

data class VoteRequest(
    @field:Positive(message = "게임 번호는 양수여야 합니다")
    val gameNumber: Int,

    @field:Positive(message = "대상 플레이어 ID는 양수여야 합니다")
    val targetPlayerId: Long
)
