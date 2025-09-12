package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import java.time.Instant

data class DefenseRecoveryResponse(
    val gameNumber: Int,
    val hasActiveDefense: Boolean,
    val hasActiveFinalVoting: Boolean,
    val accusedPlayerId: Long?,
    val accusedPlayerNickname: String?,
    val defenseText: String?,
    val isDefenseSubmitted: Boolean,
    // 요구사항에 따른 일관된 필드들
    val currentPhase: GamePhase?,
    val phaseEndTime: Instant?,
    val finalVotingRecord: List<Map<String, Any>>?,
    val scoreboard: List<ScoreboardEntry>?,
    val targetPoints: Int?
)