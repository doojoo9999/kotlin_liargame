package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.response.PlayerVotingInfo
import org.example.kotlin_liargame.domain.game.dto.response.VotingStartMessage
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.PlayerReadinessEntity
import org.example.kotlin_liargame.global.config.GameProperties
import org.example.kotlin_liargame.tools.websocket.dto.HintSubmittedEvent
import org.example.kotlin_liargame.tools.websocket.dto.PlayerVotedEvent
import org.example.kotlin_liargame.tools.websocket.dto.TurnChangedEvent
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class GameMonitoringService(
    private val messagingTemplate: SimpMessagingTemplate,
    private val gameMessagingService: org.example.kotlin_liargame.global.messaging.GameMessagingService,
    private val gameProperties: GameProperties
) {

    fun broadcastEvent(gameNumber: Int, payload: Any) {
        gameMessagingService.broadcastGameEvent(gameNumber, payload)
    }

    fun notifyPlayerJoined(game: GameEntity, newPlayer: PlayerEntity, currentPlayers: List<PlayerEntity>) {
        val roomPayload = mapOf(
            "type" to "PLAYER_JOINED",
            "gameNumber" to game.gameNumber,
            "playerName" to newPlayer.nickname,
            "userId" to newPlayer.userId,
            "currentPlayers" to currentPlayers.size,
            "maxPlayers" to game.gameParticipants
        )
        gameMessagingService.sendRoomUpdate(game.gameNumber, roomPayload)
        gameMessagingService.sendLobbyUpdate(roomPayload)

        val eventPayload = mapOf(
            "playerId" to newPlayer.id,
            "playerName" to newPlayer.nickname,
            "nickname" to newPlayer.nickname,
            "userId" to newPlayer.userId,
            "isHost" to (game.gameOwner == newPlayer.nickname),
            "isReady" to false,
            "currentPlayers" to currentPlayers.size,
            "maxPlayers" to game.gameParticipants
        )
        val eventMessage = mapOf(
            "type" to "PLAYER_JOINED",
            "gameNumber" to game.gameNumber,
            "timestamp" to Instant.now().toString(),
            "payload" to eventPayload
        )
        gameMessagingService.broadcastGameEvent(game.gameNumber, eventMessage)
    }

    fun notifyPlayerLeft(game: GameEntity, departingPlayer: PlayerEntity, remainingPlayers: List<PlayerEntity>) {
        val roomPayload = mapOf(
            "type" to "PLAYER_LEFT",
            "gameNumber" to game.gameNumber,
            "playerName" to departingPlayer.nickname,
            "userId" to departingPlayer.userId,
            "currentPlayers" to remainingPlayers.size,
            "maxPlayers" to game.gameParticipants
        )
        gameMessagingService.sendRoomUpdate(game.gameNumber, roomPayload)
        gameMessagingService.sendLobbyUpdate(roomPayload)

        val eventPayload = mapOf(
            "playerId" to departingPlayer.id,
            "playerName" to departingPlayer.nickname,
            "nickname" to departingPlayer.nickname,
            "userId" to departingPlayer.userId,
            "currentPlayers" to remainingPlayers.size,
            "maxPlayers" to game.gameParticipants
        )
        val eventMessage = mapOf(
            "type" to "PLAYER_LEFT",
            "gameNumber" to game.gameNumber,
            "timestamp" to Instant.now().toString(),
            "payload" to eventPayload
        )
        gameMessagingService.broadcastGameEvent(game.gameNumber, eventMessage)
    }

    fun notifyRoomDeleted(gameNumber: Int, reason: String? = null) {
        val timestamp = Instant.now().toString()
        val lobbyPayload = mapOf(
            "type" to "ROOM_DELETED",
            "gameNumber" to gameNumber,
            "timestamp" to timestamp
        )
        gameMessagingService.sendLobbyUpdate(lobbyPayload)

        val eventPayload = mapOf(
            "type" to "ROOM_DELETED",
            "gameNumber" to gameNumber,
            "timestamp" to timestamp,
            "payload" to mapOf(
                "reason" to (reason ?: "CLEANUP"),
                "message" to "방이 정리되었습니다. 로비로 이동해 주세요."
            )
        )
        gameMessagingService.broadcastGameEvent(gameNumber, eventPayload)
        gameMessagingService.sendRoomUpdate(gameNumber, eventPayload)
    }

    fun broadcastGameState(game: GameEntity, gameStateResponse: Any) {
        gameMessagingService.broadcastGameState(game.gameNumber, gameStateResponse)
    }

    fun notifyPlayerVoted(gameNumber: Int, voterId: Long, targetId: Long) {
        val event = PlayerVotedEvent(gameNumber = gameNumber, voterId = voterId, targetId = targetId)
        gameMessagingService.broadcastGameEvent(gameNumber, event)
    }

    fun notifyHintSubmitted(gameNumber: Int, playerId: Long, hint: String) {
        val event = HintSubmittedEvent(gameNumber = gameNumber, userId = playerId, hint = hint)
        gameMessagingService.broadcastGameEvent(gameNumber, event)
    }

    fun notifyTurnChanged(gameNumber: Int, currentPlayerId: Long, turnStartedAt: Instant, phaseEndTime: Instant?) {
        val event = TurnChangedEvent(
            gameNumber = gameNumber,
            currentPlayerId = currentPlayerId,
            turnStartedAt = turnStartedAt,
            turnTimeoutSeconds = gameProperties.turnTimeoutSeconds,
            phaseEndTime = phaseEndTime
        )
        gameMessagingService.broadcastGameEvent(gameNumber, event)
    }

    fun notifyVotingStarted(game: GameEntity, voters: List<PlayerEntity>, votingTimeSeconds: Long) {
        val payload = VotingStartMessage(
            gameNumber = game.gameNumber,
            availablePlayers = voters.map { PlayerVotingInfo(id = it.userId, nickname = it.nickname) },
            votingTimeLimit = votingTimeSeconds.toInt(),
            timestamp = Instant.now()
        )

        val eventMessage = mapOf(
            "type" to "VOTING_START",
            "gameNumber" to game.gameNumber,
            "gameId" to game.gameNumber.toString(),
            "timestamp" to Instant.now().toString(),
            "payload" to payload
        )

        gameMessagingService.broadcastGameEvent(game.gameNumber, eventMessage)
    }

    fun notifyPlayerReadyStateChanged(
        game: GameEntity,
        playerId: Long,
        readiness: PlayerReadinessEntity,
        allReady: Boolean,
        readyCount: Int,
        totalPlayers: Int
    ) {
        val payload = mapOf(
            "type" to "PLAYER_READY_CHANGED",
            "gameNumber" to game.gameNumber,
            "userId" to readiness.userId,
            "playerId" to playerId,
            "nickname" to readiness.nickname,
            "isReady" to readiness.isReady,
            "allReady" to allReady,
            "readyCount" to readyCount,
            "totalPlayers" to totalPlayers,
            "updatedAt" to readiness.updatedAt.toString()
        )

        gameMessagingService.broadcastGameEvent(game.gameNumber, payload)
        gameMessagingService.sendRoomUpdate(game.gameNumber, payload)
    }

    fun notifyCountdownStarted(game: GameEntity, countdownEndTime: Instant) {
        val payload = mapOf(
            "type" to "COUNTDOWN_STARTED",
            "gameNumber" to game.gameNumber,
            "endTime" to countdownEndTime.toString(),
            "durationSeconds" to (game.countdownDurationSeconds)
        )
        gameMessagingService.sendRoomUpdate(game.gameNumber, payload)
        gameMessagingService.broadcastGameEvent(game.gameNumber, payload)
    }

    fun notifyCountdownCancelled(game: GameEntity) {
        val payload = mapOf(
            "type" to "COUNTDOWN_CANCELLED",
            "gameNumber" to game.gameNumber
        )
        gameMessagingService.sendRoomUpdate(game.gameNumber, payload)
        gameMessagingService.broadcastGameEvent(game.gameNumber, payload)
    }

    fun notifyPlayerConnectionChanged(game: GameEntity, player: PlayerEntity, isConnected: Boolean) {
        val connectionType = if (isConnected) "PLAYER_RECONNECTED" else "PLAYER_DISCONNECTED"

        val roomPayload = mapOf(
            "type" to connectionType,
            "gameNumber" to game.gameNumber,
            "userId" to player.userId,
            "playerName" to player.nickname,
            "nickname" to player.nickname,
            "isConnected" to isConnected,
            "timestamp" to Instant.now().toString()
        )

        gameMessagingService.sendRoomUpdate(game.gameNumber, roomPayload)

        val eventPayload = mapOf(
            "userId" to player.userId,
            "nickname" to player.nickname,
            "isConnected" to isConnected,
            "lastActiveAt" to player.lastActiveAt?.toString()
        )

        val eventMessage = mapOf(
            "type" to connectionType,
            "gameNumber" to game.gameNumber,
            "timestamp" to Instant.now().toString(),
            "payload" to eventPayload
        )

        gameMessagingService.broadcastGameEvent(game.gameNumber, eventMessage)
    }
}
