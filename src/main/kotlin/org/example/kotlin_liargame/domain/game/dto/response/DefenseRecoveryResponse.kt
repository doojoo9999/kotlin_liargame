package org.example.kotlin_liargame.domain.game.dto.response

data class DefenseRecoveryResponse(
    val gameNumber: Int,
    val hasActiveDefense: Boolean,
    val hasActiveFinalVoting: Boolean,
    val accusedPlayerId: Long?,
    val defenseText: String?,
    val isDefenseSubmitted: Boolean
)