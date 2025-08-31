package org.example.kotlin_liargame.domain.game.dto.request

import jakarta.validation.constraints.Positive

data class JoinGameRequest(
    @field:Positive(message = "게임 번호는 양수여야 합니다")
    val gameNumber: Int,
    val gamePassword: String? = null,
    // 세션 복구/식별 fallback 용 (테스트 및 세션 유실 대비)
    val nickname: String? = null
)
