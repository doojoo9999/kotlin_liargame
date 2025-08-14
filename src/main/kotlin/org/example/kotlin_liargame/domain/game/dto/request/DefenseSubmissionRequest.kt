package org.example.kotlin_liargame.domain.game.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size

data class DefenseSubmissionRequest(
    @field:Positive(message = "플레이어 ID는 양수여야 합니다")
    val playerId: Long,
    
    @field:NotBlank(message = "변론 내용을 입력해 주세요")
    @field:Size(max = 500, message = "변론 내용은 500자를 초과할 수 없습니다")
    val defenseText: String
)