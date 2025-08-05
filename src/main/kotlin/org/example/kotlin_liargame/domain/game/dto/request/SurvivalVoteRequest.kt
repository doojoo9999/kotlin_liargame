package org.example.kotlin_liargame.domain.game.dto.request

data class SurvivalVoteRequest(
    val gameNumber: Int,
    val accusedPlayerId: Long,
    val voteToSurvive: Boolean
) {
    fun validate() {
        if (gameNumber <= 0) {
            throw IllegalArgumentException("게임 번호는 양수여야 합니다")
        }
        
        if (accusedPlayerId <= 0) {
            throw IllegalArgumentException("고발된 플레이어 ID는 양수여야 합니다")
        }
    }
}
