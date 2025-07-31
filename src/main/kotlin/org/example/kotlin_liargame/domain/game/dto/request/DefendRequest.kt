package org.example.kotlin_liargame.domain.game.dto.request

data class DefendRequest(
    val gNumber: Int,
    val defense: String
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("게임 번호???�수?�야 ?�니??)
        }
        
        if (defense.isBlank()) {
            throw IllegalArgumentException("변�??�용?� 비어 ?�을 ???�습?�다")
        }
        
        if (defense.length > 200) {
            throw IllegalArgumentException("변�??�용?� 200?��? 초과?????�습?�다")
        }
    }
}
