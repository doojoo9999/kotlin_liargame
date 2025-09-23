package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload

data class OwnerKickResponse(
    val newOwner: String,
    val kickedPlayer: String,
    val gameNumber: Int
) : GameFlowPayload

data class TimeExtensionResponse(
    val extendedUntil: String,
    val gameNumber: Int
)
