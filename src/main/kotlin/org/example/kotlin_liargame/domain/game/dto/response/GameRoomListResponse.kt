package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.GameEntity

data class GameRoomListResponse(
    val gameRooms: List<GameRoomInfo>
) {
    companion object {
        fun from(games: List<GameEntity>, playerCounts: Map<Long, Int>): GameRoomListResponse {
            return GameRoomListResponse(
                gameRooms = games.map { game -> 
                    GameRoomInfo.from(game, playerCounts[game.id] ?: 0) 
                }
            )
        }
    }
}

data class GameRoomInfo(
    val gameNumber: Int,
    val gameName: String,
    val hasPassword: Boolean,
    val playerCount: Int,
    val maxPlayers: Int,
    val status: String
) {
    companion object {
        fun from(game: GameEntity, playerCount: Int = 0): GameRoomInfo {
            return GameRoomInfo(
                gameNumber = game.gNumber,
                gameName = game.gName,
                hasPassword = game.gPassword != null,
                playerCount = playerCount,
                maxPlayers = game.gParticipants,
                status = game.gState.name
            )
        }
    }
}
