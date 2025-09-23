package org.example.kotlin_liargame.domain.game.dto.request

import jakarta.validation.constraints.Positive

data class EndDefenseRequest(
    @field:Positive(message = "게임 번호는 양수여야 합니다")
    val gameNumber: Int
)