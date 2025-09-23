package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload
import java.time.Instant

data class CountdownResponse(
    val gameNumber: Int,
    val countdownEndTime: Instant?,
    val durationSeconds: Int,
    val canCancel: Boolean
) : GameFlowPayload

