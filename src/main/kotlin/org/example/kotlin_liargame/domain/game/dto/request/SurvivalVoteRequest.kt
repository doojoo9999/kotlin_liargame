package org.example.kotlin_liargame.domain.game.dto.request

data class SurvivalVoteRequest(
    val gNumber: Int,
    val accusedPlayerId: Long,
    val voteToSurvive: Boolean
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("게임 번호는 양수여야 합니다")
        }
        
        if (accusedPlayerId <= 0) {
            throw IllegalArgumentException("지목된 플레이어 ID는 양수여야 합니다")
        }
    }
}