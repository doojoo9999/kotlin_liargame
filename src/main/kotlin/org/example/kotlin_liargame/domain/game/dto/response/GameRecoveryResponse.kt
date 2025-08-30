package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.enum.GamePhase

data class GameRecoveryResponse(
    val gameNumber: Int,
    val gameState: String,
    val scoreboard: List<ScoreboardEntry>,
    val targetPoints: Int,
    val finalVotingRecord: List<FinalVoteResponse>,
    val currentPhase: GamePhase,
    val phaseEndTime: String?,
    val accusedPlayerId: Long?,
    val accusedNickname: String?,
    val currentAccusationTargetId: Long?,
    val gameCurrentRound: Int,
    val turnOrder: List<String>?,
    val currentTurnIndex: Int?,
    val defenseReentryCount: Int,
    val recentSystemHeadline: String?,
    val defense: DefenseRecoveryResponse,
    val player: PlayerInfo,
    val timestamp: String
) {
    data class PlayerInfo(
        val id: Long,
        val nickname: String,
        val isAlive: Boolean,
        val role: String
    )
}