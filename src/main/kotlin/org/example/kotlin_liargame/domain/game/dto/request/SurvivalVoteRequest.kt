package org.example.kotlin_liargame.domain.game.dto.request

data class SurvivalVoteRequest(
    val gNumber: Int,
    val accusedPlayerId: Long,
    val voteToSurvive: Boolean
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("게임 번호???�수?�야 ?�니??)
        }
        
        if (accusedPlayerId <= 0) {
            throw IllegalArgumentException("고발???�레?�어 ID???�수?�야 ?�니??)
        }
    }
}
