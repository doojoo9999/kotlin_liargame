package org.example.kotlin_liargame.domain.game.dto.request

data class SurvivalVoteRequest(
    val gNumber: Int,
    val accusedPlayerId: Long,
    val voteToSurvive: Boolean
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("ê²Œìž„ ë²ˆí˜¸???‘ìˆ˜?¬ì•¼ ?©ë‹ˆ??)
        }
        
        if (accusedPlayerId <= 0) {
            throw IllegalArgumentException("ê³ ë°œ???Œë ˆ?´ì–´ ID???‘ìˆ˜?¬ì•¼ ?©ë‹ˆ??)
        }
    }
}
