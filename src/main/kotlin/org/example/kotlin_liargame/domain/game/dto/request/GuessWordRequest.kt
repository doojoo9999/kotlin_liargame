package org.example.kotlin_liargame.domain.game.dto.request

data class GuessWordRequest(
    val gNumber: Int,
    val guess: String
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("ê²Œì„ ë²ˆí˜¸???‘ìˆ˜?¬ì•¼ ?©ë‹ˆ??)
        }
        
        if (guess.isBlank()) {
            throw IllegalArgumentException("ì¶”ì¸¡ ?¨ì–´??ë¹„ì–´ ?ˆì„ ???†ìŠµ?ˆë‹¤")
        }
        
        if (guess.length > 100) {
            throw IllegalArgumentException("ì¶”ì¸¡ ?¨ì–´??100?ë? ì´ˆê³¼?????†ìŠµ?ˆë‹¤")
        }
    }
}
