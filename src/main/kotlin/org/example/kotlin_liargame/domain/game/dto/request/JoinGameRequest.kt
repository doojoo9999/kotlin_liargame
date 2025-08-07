package org.example.kotlin_liargame.domain.game.dto.request

import jakarta.validation.constraints.Positive

data class JoinGameRequest(
    @field:Positive(message = "게임 번호는 양수여야 합니다")
    val gameNumber: Int,
    val gamePassword: String? = null
)
