package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload

data class PlayerReadyResponse(
    val playerId: Long,
    val nickname: String,
    val isReady: Boolean,
    val allPlayersReady: Boolean,
    val readyCount: Int,
    val totalPlayers: Int
) : GameFlowPayload

