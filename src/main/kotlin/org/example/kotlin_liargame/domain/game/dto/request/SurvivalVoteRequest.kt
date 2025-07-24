package org.example.kotlin_liargame.domain.game.dto.request

data class SurvivalVoteRequest(
    val gNumber: Int,
    val accusedPlayerId: Long,
    val voteToSurvive: Boolean
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("Game number must be positive")
        }
        
        if (accusedPlayerId <= 0) {
            throw IllegalArgumentException("Accused player ID must be positive")
        }
    }
}