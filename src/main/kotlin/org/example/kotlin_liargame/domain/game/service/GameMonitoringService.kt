package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service

@Service
class GameMonitoringService(
    private val messagingTemplate: SimpMessagingTemplate
) {

    fun notifyPlayerJoined(game: GameEntity, newPlayer: PlayerEntity, currentPlayers: List<PlayerEntity>) {
        val payload = mapOf(
            "type" to "PLAYER_JOINED",
            "gameNumber" to game.gameNumber,
            "playerName" to newPlayer.nickname,
            "userId" to newPlayer.userId,
            "currentPlayers" to currentPlayers.size,
            "maxPlayers" to game.gameParticipants
        )
        messagingTemplate.convertAndSend("/topic/room.${game.gameNumber}", payload)
        messagingTemplate.convertAndSend("/topic/lobby", payload)
    }


    fun notifyPlayerLeft(game: GameEntity, playerName: String, userId: Long, remainingPlayers: List<PlayerEntity>) {
        val payload = mapOf(
            "type" to "PLAYER_LEFT",
            "gameNumber" to game.gameNumber,
            "playerName" to playerName,
            "userId" to userId,
            "currentPlayers" to remainingPlayers.size,
            "maxPlayers" to game.gameParticipants
        )
        messagingTemplate.convertAndSend("/topic/room.${game.gameNumber}", payload)
        messagingTemplate.convertAndSend("/topic/lobby", payload)
    }

    fun notifyRoomDeleted(gameNumber: Int) {
        val payload = mapOf(
            "type" to "ROOM_DELETED",
            "gameNumber" to gameNumber
        )
        messagingTemplate.convertAndSend("/topic/lobby", payload)
    }

    fun broadcastGameState(game: GameEntity, gameStateResponse: Any) {
        messagingTemplate.convertAndSend("/topic/game/${game.gameNumber}/state", gameStateResponse)
    }
}
