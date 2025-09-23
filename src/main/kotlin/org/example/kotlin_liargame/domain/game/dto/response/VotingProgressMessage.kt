package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameRealtimePayload
import java.time.Instant

data class VotingProgressMessage(
    val gameNumber: Int,
    val votedCount: Int,
    val totalCount: Int,
    val timestamp: Instant
) : GameRealtimePayload
