package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity

data class GameRoomListResponse(
    val gameRooms: List<GameRoomInfo>
) : GameFlowPayload {
    companion object {
        fun from(games: List<GameEntity>, playerCounts: Map<Long, Int>, playersMap: Map<Long, List<PlayerEntity>> = emptyMap(), gameSubjectsMap: Map<Long, List<String>> = emptyMap()): GameRoomListResponse {
            return GameRoomListResponse(
                gameRooms = games.map { game -> 
                    GameRoomInfo.from(game, playerCounts[game.id] ?: 0, playersMap[game.id] ?: emptyList(), gameSubjectsMap[game.id] ?: emptyList()) 
                }
            )
        }
    }
}

data class GameRoomInfo(
    val gameNumber: Int,
    val title: String,
    val host: String,
    val currentPlayers: Int,
    val maxPlayers: Int,
    val hasPassword: Boolean,
    val subject: String?,
    val subjects: List<String>,
    val state: String,
    val players: List<PlayerResponse>
) {
    companion object {
        fun from(game: GameEntity, playerCount: Int = 0, players: List<PlayerEntity> = emptyList(), gameSubjects: List<String> = emptyList()): GameRoomInfo {
            // Format title as "gameName #gameNumber"
            val formattedTitle = "${game.gameName} #${game.gameNumber}"
            
            // Use all subjects if available, otherwise fallback to single subject
            val subjectDisplay = if (gameSubjects.isNotEmpty()) {
                gameSubjects.joinToString(", ")
            } else {
                game.citizenSubject?.content ?: "주제 없음"
            }
            
            return GameRoomInfo(
                gameNumber = game.gameNumber,
                title = formattedTitle,
                host = game.gameOwner,
                currentPlayers = playerCount,
                maxPlayers = game.gameParticipants,
                hasPassword = game.gamePassword != null,
                subject = subjectDisplay,
                subjects = gameSubjects,
                state = game.gameState.name,
                players = players.map { PlayerResponse.from(it) }
            )
        }
    }
}
