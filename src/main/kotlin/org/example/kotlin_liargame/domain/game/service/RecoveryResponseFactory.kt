package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.response.DefenseRecoveryResponse
import org.example.kotlin_liargame.domain.game.dto.response.GameRecoveryResponse
import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.time.Instant

@Component
class RecoveryResponseFactory {
    
    private val logger = LoggerFactory.getLogger(RecoveryResponseFactory::class.java)
    
    fun buildUnauthorizedResponse(gameNumber: Int): GameRecoveryResponse {
        logger.debug("Building UNAUTHORIZED recovery response for game {}", gameNumber)
        return GameRecoveryResponse(
            gameNumber = gameNumber,
            gameState = "UNAUTHORIZED",
            scoreboard = emptyList(),
            targetPoints = 0,
            finalVotingRecord = emptyList(),
            currentPhase = GamePhase.WAITING_FOR_PLAYERS,
            phaseEndTime = null,
            accusedPlayerId = null,
            accusedNickname = null,
            currentAccusationTargetId = null,
            gameCurrentRound = 0,
            turnOrder = null,
            currentTurnIndex = null,
            defenseReentryCount = 0,
            recentSystemHeadline = "Not authenticated",
            defense = DefenseRecoveryResponse(
                gameNumber = gameNumber,
                hasActiveDefense = false,
                hasActiveFinalVoting = false,
                accusedPlayerId = null,
                accusedPlayerNickname = null,
                defenseText = null,
                isDefenseSubmitted = false,
                currentPhase = null,
                phaseEndTime = null,
                finalVotingRecord = null,
                scoreboard = null,
                targetPoints = null
            ),
            player = GameRecoveryResponse.PlayerInfo(0, "Unknown", false, "NONE"),
            timestamp = Instant.now().toString()
        )
    }
    
    fun buildErrorResponse(gameNumber: Int, errorMessage: String): GameRecoveryResponse {
        logger.debug("Building ERROR recovery response for game {} with message: {}", gameNumber, errorMessage)
        return GameRecoveryResponse(
            gameNumber = gameNumber,
            gameState = "ERROR",
            scoreboard = emptyList(),
            targetPoints = 0,
            finalVotingRecord = emptyList(),
            currentPhase = GamePhase.WAITING_FOR_PLAYERS,
            phaseEndTime = null,
            accusedPlayerId = null,
            accusedNickname = null,
            currentAccusationTargetId = null,
            gameCurrentRound = 0,
            turnOrder = null,
            currentTurnIndex = null,
            defenseReentryCount = 0,
            recentSystemHeadline = "Failed to recover game state: $errorMessage",
            defense = DefenseRecoveryResponse(
                gameNumber = gameNumber,
                hasActiveDefense = false,
                hasActiveFinalVoting = false,
                accusedPlayerId = null,
                accusedPlayerNickname = null,
                defenseText = null,
                isDefenseSubmitted = false,
                currentPhase = null,
                phaseEndTime = null,
                finalVotingRecord = null,
                scoreboard = null,
                targetPoints = null
            ),
            player = GameRecoveryResponse.PlayerInfo(0, "Unknown", false, "NONE"),
            timestamp = Instant.now().toString()
        )
    }
}