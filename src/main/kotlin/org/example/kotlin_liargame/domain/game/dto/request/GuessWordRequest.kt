package org.example.kotlin_liargame.domain.game.dto.request

data class GuessWordRequest(
    val gNumber: Int,
    val guess: String
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("게임 번호???�수?�야 ?�니??)
        }
        
        if (guess.isBlank()) {
            throw IllegalArgumentException("추측 ?�어??비어 ?�을 ???�습?�다")
        }
        
        if (guess.length > 100) {
            throw IllegalArgumentException("추측 ?�어??100?��? 초과?????�습?�다")
        }
    }
}
