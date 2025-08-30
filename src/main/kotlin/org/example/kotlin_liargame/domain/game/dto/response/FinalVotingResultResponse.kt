package org.example.kotlin_liargame.domain.game.dto.response

data class FinalVotingResultResponse(
    val gameNumber: Int,
    val accusedPlayerId: Long,
    val accusedPlayerNickname: String,
    val executionVotes: Int,
    val survivalVotes: Int,
    val totalVotes: Int,
    val isExecuted: Boolean,
    val defenseText: String,
    val finalVotingRecord: List<Map<String, Any>> = emptyList(),
    val scoreboard: List<ScoreboardEntry> = emptyList(),
    val targetPoints: Int = 0
)