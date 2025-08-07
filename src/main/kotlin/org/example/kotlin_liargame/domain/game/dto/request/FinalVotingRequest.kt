package org.example.kotlin_liargame.domain.game.dto.request

data class FinalVotingRequest(
    val voterPlayerId: Long,
    val voteForExecution: Boolean
) {
    fun validate() {
        if (voterPlayerId <= 0) {
            throw IllegalArgumentException("투표자 ID는 양수여야 합니다")
        }
    }
}