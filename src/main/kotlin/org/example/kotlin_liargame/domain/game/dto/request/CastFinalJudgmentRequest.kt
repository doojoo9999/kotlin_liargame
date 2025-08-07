package org.example.kotlin_liargame.domain.game.dto.request

data class CastFinalJudgmentRequest(
    val gameNumber: Int,
    val voteForExecution: Boolean // true = 처형, false = 생존
) {
    fun validate() {
        require(gameNumber > 0) { "Game number must be positive" }
    }
}