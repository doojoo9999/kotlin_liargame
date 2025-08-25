package org.example.kotlin_liargame.domain.game.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size

data class GuessWordRequest(
    @field:Positive(message = "게임 번호는 양수여야 합니다")
    val gameNumber: Int,

    @field:NotBlank(message = "추측 단어는 비어 있을 수 없습니다")
    @field:Size(max = 100, message = "추측 단어는 100자를 초과할 수 없습니다")
    val guess: String
)
