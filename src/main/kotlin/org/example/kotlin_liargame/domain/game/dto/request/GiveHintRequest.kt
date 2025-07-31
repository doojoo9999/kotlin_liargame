package org.example.kotlin_liargame.domain.game.dto.request

data class GiveHintRequest(
    val gNumber: Int,
    val hint: String
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("ê²Œì„ ë²ˆí˜¸???‘ìˆ˜?¬ì•¼ ?©ë‹ˆ??)
        }
        
        if (hint.isBlank()) {
            throw IllegalArgumentException("?ŒíŠ¸??ë¹„ì–´ ?ˆì„ ???†ìŠµ?ˆë‹¤")
        }
        
        if (hint.length > 200) {
            throw IllegalArgumentException("?ŒíŠ¸??200?ë? ì´ˆê³¼?????†ìŠµ?ˆë‹¤")
        }
    }
}
