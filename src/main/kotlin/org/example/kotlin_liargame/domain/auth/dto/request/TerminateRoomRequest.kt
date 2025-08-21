package org.example.kotlin_liargame.domain.auth.dto.request

import jakarta.validation.constraints.Positive

data class TerminateRoomRequest(
    @field:Positive(message = "게임 번호는 양수여야 합니다.")
    val gameNumber: Int
)
