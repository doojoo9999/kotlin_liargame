package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity

data class GameRoomListResponse(
    val gameRooms: List<GameRoomInfo>
) {
    companion object {
        fun from(games: List<GameEntity>, playerCounts: Map<Long, Int>, playersMap: Map<Long, List<PlayerEntity>> = emptyMap()): GameRoomListResponse {
            return GameRoomListResponse(
                gameRooms = games.map { game -> 
                    GameRoomInfo.from(game, playerCounts[game.id] ?: 0, playersMap[game.id] ?: emptyList()) 
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
    val state: String,
    val players: List<PlayerResponse>
) {
    companion object {
        fun from(game: GameEntity, playerCount: Int = 0, players: List<PlayerEntity> = emptyList()): GameRoomInfo {
            return GameRoomInfo(
                gameNumber = game.gNumber,
                title = game.gName,
                host = game.gOwner,
                currentPlayers = playerCount,
                maxPlayers = game.gParticipants,
                hasPassword = game.gPassword != null,
                subject = game.citizenSubject?.content,
                state = game.gState.name,
                players = players.map { PlayerResponse.from(it) }
            )
        }
    }
}
