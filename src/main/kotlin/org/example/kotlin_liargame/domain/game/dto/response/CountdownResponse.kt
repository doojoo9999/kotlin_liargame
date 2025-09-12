package org.example.kotlin_liargame.domain.game.dto.response

import java.time.Instant

data class CountdownResponse(
    val gameNumber: Int,
    val countdownEndTime: Instant?,
    val durationSeconds: Int,
    val canCancel: Boolean
)

