package org.example.kotlin_liargame.domain.game.dto.request

data class LeaveGameRequest(
    val gNumber: Int
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("유효하지 않은 게임 번호입니다: $gNumber")
        }
    }
}
