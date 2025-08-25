package org.example.kotlin_liargame.domain.game.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size

data class GiveHintRequest(
    @field:Positive(message = "게임 번호는 양수여야 합니다")
    val gameNumber: Int,

    @field:NotBlank(message = "힌트는 비어 있을 수 없습니다")
    @field:Size(max = 200, message = "힌트는 200자를 초과할 수 없습니다")
    val hint: String
)
