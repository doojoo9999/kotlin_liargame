package org.example.kotlin_liargame.domain.game.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size

data class SubmitDefenseRequest(
    @field:Positive(message = "게임 번호는 양수여야 합니다")
    val gameNumber: Int,
    
    @field:NotBlank(message = "변론 내용은 비어 있을 수 없습니다")
    @field:Size(max = 200, message = "변론 내용은 200자를 초과할 수 없습니다")
    val defenseText: String
)