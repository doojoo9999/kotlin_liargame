package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload

data class LiarGuessResultResponse(
    val gameNumber: Int,
    val liarGuess: String,
    val correctAnswer: String,
    val isCorrect: Boolean,
    val winner: String, // "LIARS" or "CITIZENS"
    val gameEnd: Boolean = true
) : GameFlowPayload
