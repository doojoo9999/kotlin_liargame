package org.example.kotlin_liargame.domain.game.dto.request

data class GiveHintRequest(
    val gNumber: Int,
    val hint: String
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("게임 번호???�수?�야 ?�니??)
        }
        
        if (hint.isBlank()) {
            throw IllegalArgumentException("?�트??비어 ?�을 ???�습?�다")
        }
        
        if (hint.length > 200) {
            throw IllegalArgumentException("?�트??200?��? 초과?????�습?�다")
        }
    }
}
