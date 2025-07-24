package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import org.example.kotlin_liargame.domain.game.model.enum.GameState

data class GameStateResponse(
    val gNumber: Int,
    val gName: String,
    val gOwner: String,
    val gParticipants: Int,
    val gCurrentRound: Int,
    val gTotalRounds: Int,
    val gLiarCount: Int,
    val gGameMode: GameMode,
    val gState: GameState,
    val players: List<PlayerResponse>,
    val currentPhase: GamePhase,
    val yourRole: String? = null,
    val yourWord: String? = null,
    val accusedPlayer: PlayerResponse? = null
) {
    companion object {
        fun from(
            game: GameEntity,
            players: List<PlayerEntity>,
            currentUserId: Long?,
            currentPhase: GamePhase,
            accusedPlayer: PlayerEntity? = null
        ): GameStateResponse {
            val currentPlayer = players.find { it.userId == currentUserId }
            
            return GameStateResponse(
                gNumber = game.gNumber,
                gName = game.gName,
                gOwner = game.gOwner,
                gParticipants = game.gParticipants,
                gCurrentRound = game.gCurrentRound,
                gTotalRounds = game.gTotalRounds,
                gLiarCount = game.gLiarCount,
                gGameMode = game.gGameMode,
                gState = game.gState,
                players = players.map { PlayerResponse.from(it) },
                currentPhase = currentPhase,
                yourRole = currentPlayer?.role?.name,
                yourWord = currentPlayer?.subject?.content,
                accusedPlayer = accusedPlayer?.let { PlayerResponse.from(it) }
            )
        }
    }
}

