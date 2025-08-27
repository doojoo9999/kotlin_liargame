package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.tools.websocket.dto.HintSubmittedEvent
import org.example.kotlin_liargame.tools.websocket.dto.PlayerVotedEvent
import org.example.kotlin_liargame.tools.websocket.dto.TurnChangedEvent
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class GameMonitoringService(
    private val messagingTemplate: SimpMessagingTemplate,
    private val gameMessagingService: org.example.kotlin_liargame.global.messaging.GameMessagingService
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
        gameMessagingService.sendRoomUpdate(game.gameNumber, payload)
        gameMessagingService.sendLobbyUpdate(payload)
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
        gameMessagingService.sendRoomUpdate(game.gameNumber, payload)
        gameMessagingService.sendLobbyUpdate(payload)
    }

    fun notifyRoomDeleted(gameNumber: Int) {
        val payload = mapOf(
            "type" to "ROOM_DELETED",
            "gameNumber" to gameNumber
        )
        gameMessagingService.sendLobbyUpdate(payload)
    }

    fun broadcastGameState(game: GameEntity, gameStateResponse: Any) {
        gameMessagingService.broadcastGameState(game.gameNumber, gameStateResponse)
    }

    fun notifyPlayerVoted(gameNumber: Int, voterId: Long, targetId: Long) {
        val event = PlayerVotedEvent(gameNumber = gameNumber, voterId = voterId, targetId = targetId)
        gameMessagingService.broadcastGameEvent(gameNumber, event)
    }

    fun notifyHintSubmitted(gameNumber: Int, playerId: Long, hint: String) {
        val event = HintSubmittedEvent(gameNumber = gameNumber, playerId = playerId, hint = hint)
        gameMessagingService.broadcastGameEvent(gameNumber, event)
    }

    fun notifyTurnChanged(gameNumber: Int, currentPlayerId: Long, turnStartedAt: Instant) {
        val event = TurnChangedEvent(gameNumber = gameNumber, currentPlayerId = currentPlayerId, turnStartedAt = turnStartedAt)
        gameMessagingService.broadcastGameEvent(gameNumber, event)
    }
}