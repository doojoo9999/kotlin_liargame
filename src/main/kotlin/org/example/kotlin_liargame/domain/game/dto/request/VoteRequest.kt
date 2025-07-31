package org.example.kotlin_liargame.domain.game.dto.request

data class VoteRequest(
    val gNumber: Int,
    val targetPlayerId: Long
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("게임 번호???�수?�야 ?�니??)
        }
        
        if (targetPlayerId <= 0) {
            throw IllegalArgumentException("?�???�레?�어 ID???�수?�야 ?�니??)
        }
    }
}
