package org.example.kotlin_liargame.domain.game.dto.request

data class VoteRequest(
    val gameNumber: Int,
    val targetPlayerId: Long
) {
    fun validate() {
        if (gameNumber <= 0) {
            throw IllegalArgumentException("게임 번호는 양수여야 합니다")
        }
        
        if (targetPlayerId <= 0) {
            throw IllegalArgumentException("대상 플레이어 ID는 양수여야 합니다")
        }
    }
}
