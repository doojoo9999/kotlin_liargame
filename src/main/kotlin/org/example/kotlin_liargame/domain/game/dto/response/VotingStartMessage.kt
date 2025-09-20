package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameRealtimePayload
import java.time.Instant

data class VotingStartMessage(
    val gameNumber: Int,
    val availablePlayers: List<PlayerVotingInfo>,
    val votingTimeLimit: Int,
    val timestamp: Instant
) : GameRealtimePayload
