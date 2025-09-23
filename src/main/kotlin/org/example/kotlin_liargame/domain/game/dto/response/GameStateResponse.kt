package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload
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
    val reason: String? = null,
    val targetPoints: Int = 0,
    val scoreboard: List<ScoreboardEntry> = emptyList(),
    val finalVotingRecord: List<Map<String, Any>>? = null
) : GameFlowPayload {
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
            reason: String? = null,
            finalVotingRecord: List<Map<String, Any>>? = null
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
                // 현재 플레이어의 역할과 받은 단어/주제 정보 추가
                yourRole = currentPlayer?.role?.name,
                yourWord = currentPlayer?.let { player ->
                    when {
                        // 게임 중일 때만 단어 공개
                        game.gameState == GameState.IN_PROGRESS -> {
                            when (player.role) {
                                org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.CITIZEN -> {
                                    // 시민은 할당받은 단어를 받음
                                    player.assignedWord ?: "단어를 받지 못했습니다"
                                }
                                org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.LIAR -> {
                                    when (game.gameMode) {
                                        org.example.kotlin_liargame.domain.game.model.enum.GameMode.LIARS_KNOW -> {
                                            "🤫 당신은 라이어입니다. 다른 사람들의 힌트를 듣고 주제를 파악하세요!"
                                        }
                                        org.example.kotlin_liargame.domain.game.model.enum.GameMode.LIARS_DIFFERENT_WORD -> {
                                            // 라이어는 다른 주제의 단어를 받음
                                            player.assignedWord ?: "단어를 받지 못했습니다"
                                        }
                                    }
                                }
                            }
                        }
                        else -> null
                    }
                },
                accusedPlayer = accusedPlayer?.let { PlayerResponse.from(it) },
                isChatAvailable = isChatAvailable,
                citizenSubject = game.citizenSubject?.content,
                liarSubject = game.liarSubject?.content,
                subjects = listOfNotNull(game.citizenSubject?.content, game.liarSubject?.content).distinct(),
                turnOrder = turnOrder,
                currentTurnIndex = currentTurnIndex,
                phaseEndTime = phaseEndTime,
                winner = winner,
                reason = reason,
                targetPoints = game.targetPoints,
                scoreboard = players.map { ScoreboardEntry.from(it) },
                finalVotingRecord = finalVotingRecord
            )
        }
    }
}
