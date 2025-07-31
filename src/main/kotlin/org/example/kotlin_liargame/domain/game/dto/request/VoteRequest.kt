package org.example.kotlin_liargame.domain.game.dto.request

data class VoteRequest(
    val gNumber: Int,
    val targetPlayerId: Long
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("ê²Œìž„ ë²ˆí˜¸???‘ìˆ˜?¬ì•¼ ?©ë‹ˆ??)
        }
        
        if (targetPlayerId <= 0) {
            throw IllegalArgumentException("?€???Œë ˆ?´ì–´ ID???‘ìˆ˜?¬ì•¼ ?©ë‹ˆ??)
        }
    }
}
