package org.example.kotlin_liargame.domain.game.dto.request

import jakarta.validation.constraints.Positive

data class SurvivalVoteRequest(
    @field:Positive(message = "게임 번호는 양수여야 합니다")
    val gameNumber: Int,
    
    @field:Positive(message = "고발된 플레이어 ID는 양수여야 합니다")
    val accusedPlayerId: Long,
    
    val voteToSurvive: Boolean
)
