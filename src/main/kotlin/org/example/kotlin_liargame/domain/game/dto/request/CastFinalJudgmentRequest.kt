package org.example.kotlin_liargame.domain.game.dto.request

import org.example.kotlin_liargame.domain.game.model.enum.FinalJudgment

data class CastFinalJudgmentRequest(
    val gameNumber: Int,
    val judgment: FinalJudgment
) {
    fun validate() {
        require(gameNumber > 0) { "Game number must be positive" }
    }
}