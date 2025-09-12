package org.example.kotlin_liargame.domain.game.dto.response

data class OwnerKickResponse(
    val newOwner: String,
    val kickedPlayer: String,
    val gameNumber: Int
)

data class TimeExtensionResponse(
    val extendedUntil: String,
    val gameNumber: Int
)
