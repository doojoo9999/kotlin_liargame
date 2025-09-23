package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameRealtimePayload

data class CountdownUpdateResponse(
    val gameNumber: Int,
    val remainingTime: Int,
    val phase: String
) : GameRealtimePayload
