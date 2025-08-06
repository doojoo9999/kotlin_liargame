package org.example.kotlin_liargame.domain.game.dto.request

data class LeaveGameRequest(
    val gameNumber: Int
) {
    fun validate() {
        if (gameNumber <= 0) {
            throw IllegalArgumentException("유효하지 않은 게임 번호입니다: $gameNumber")
        }
    }
}
