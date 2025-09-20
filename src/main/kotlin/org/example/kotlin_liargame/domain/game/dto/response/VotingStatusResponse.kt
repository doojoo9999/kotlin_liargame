package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload
import java.time.Instant

data class VotingStatusResponse(
    val gameNumber: Int,
    val currentVotes: Int,
    val requiredVotes: Int,
    val totalPlayers: Int,
    val votedPlayers: List<PlayerVoteInfo>,
    val pendingPlayers: List<PlayerVoteInfo>,
    val votingDeadline: String?,
    val canChangeVote: Boolean
) : GameFlowPayload {
    companion object {
        fun empty(gameNumber: Int) = VotingStatusResponse(
            gameNumber = gameNumber,
            currentVotes = 0,
            requiredVotes = 0,
            totalPlayers = 0,
            votedPlayers = emptyList(),
            pendingPlayers = emptyList(),
            votingDeadline = null,
            canChangeVote = false
        )
    }
}

data class PlayerVoteInfo(
    val userId: Long,
    val nickname: String,
    val votedAt: Instant?
)

