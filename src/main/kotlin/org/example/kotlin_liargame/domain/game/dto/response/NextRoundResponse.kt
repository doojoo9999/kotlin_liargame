package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload
import java.time.Instant

data class NextRoundResponse(
    val gameNumber: Int,
    val currentRound: Int,
    val totalRounds: Int,
    val message: String,
    val timestamp: Instant = Instant.now()
) : GameFlowPayload
