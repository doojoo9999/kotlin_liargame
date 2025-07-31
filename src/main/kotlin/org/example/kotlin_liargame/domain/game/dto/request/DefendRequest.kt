package org.example.kotlin_liargame.domain.game.dto.request

data class DefendRequest(
    val gNumber: Int,
    val defense: String
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("ê²Œì„ ë²ˆí˜¸???‘ìˆ˜?¬ì•¼ ?©ë‹ˆ??)
        }
        
        if (defense.isBlank()) {
            throw IllegalArgumentException("ë³€ë¡??´ìš©?€ ë¹„ì–´ ?ˆì„ ???†ìŠµ?ˆë‹¤")
        }
        
        if (defense.length > 200) {
            throw IllegalArgumentException("ë³€ë¡??´ìš©?€ 200?ë? ì´ˆê³¼?????†ìŠµ?ˆë‹¤")
        }
    }
}
