package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import org.example.kotlin_liargame.domain.game.model.enum.GameState

data class GameStateResponse(
    val gameNumber: Int,
    val gameName: String,
    val gameOwner: String,
    val gameParticipants: Int,
    val gameCurrentRound: Int,
    val gameTotalRounds: Int,
    val gameLiarCount: Int,
    val gameMode: GameMode,
    val gameState: GameState,
    val players: List<PlayerResponse>,
    val currentPhase: GamePhase,
    val yourRole: String? = null,
    val yourWord: String? = null,
    val accusedPlayer: PlayerResponse? = null,
    val isChatAvailable: Boolean = false,
    val citizenSubject: String? = null,
    val liarSubject: String? = null,
    val subjects: List<String>? = null,
    val turnOrder: List<String>? = null,
    val currentTurnIndex: Int? = null,
    val phaseEndTime: String? = null,
    val winner: String? = null,
    val reason: String? = null
) {
    companion object {
        fun from(
            game: GameEntity,
            players: List<PlayerEntity>,
            currentUserId: Long?,
            currentPhase: GamePhase,
            accusedPlayer: PlayerEntity? = null,
            isChatAvailable: Boolean = false,
            turnOrder: List<String>? = null,
            currentTurnIndex: Int? = null,
            phaseEndTime: String? = null,
            winner: String? = null,
            reason: String? = null
        ): GameStateResponse {
            val currentPlayer = players.find { it.userId == currentUserId }
            
            return GameStateResponse(
                gameNumber = game.gameNumber,
                gameName = game.gameName,
                gameOwner = game.gameOwner,
                gameParticipants = game.gameParticipants,
                gameCurrentRound = game.gameCurrentRound,
                gameTotalRounds = game.gameTotalRounds,
                gameLiarCount = game.gameLiarCount,
                gameMode = game.gameMode,
                gameState = game.gameState,
                players = players.map { PlayerResponse.from(it) },
                currentPhase = currentPhase,
                                yourRole = currentPlayer?.role?.name,
                yourWord = currentPlayer?.subject?.content,
                accusedPlayer = accusedPlayer?.let { PlayerResponse.from(it) },
                isChatAvailable = isChatAvailable,
                citizenSubject = game.citizenSubject?.content,
                liarSubject = game.liarSubject?.content,
                subjects = listOfNotNull(game.citizenSubject?.content, game.liarSubject?.content).distinct(),
                turnOrder = turnOrder,
                currentTurnIndex = currentTurnIndex,
                phaseEndTime = phaseEndTime,
                winner = winner,
                reason = reason
            )
        }
    }
}


