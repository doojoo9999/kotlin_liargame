package org.example.kotlin_liargame.domain.game.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.chat.service.ChatService
import org.example.kotlin_liargame.domain.game.dto.request.JoinGameRequest
import org.example.kotlin_liargame.domain.game.dto.request.LeaveGameRequest
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.dto.response.OwnerKickResponse
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.model.enum.PlayerRole
import org.example.kotlin_liargame.domain.game.model.enum.PlayerState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.GameSubjectRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerReadinessRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.global.exception.*
import org.example.kotlin_liargame.global.security.SessionManagementService
import org.example.kotlin_liargame.global.session.SessionService
import org.example.kotlin_liargame.tools.websocket.WebSocketSessionManager
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class GamePlayerService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val playerReadinessRepository: PlayerReadinessRepository,
    private val gameSubjectRepository: GameSubjectRepository,
    private val chatService: ChatService,
    private val gameMonitoringService: GameMonitoringService,
    private val sessionService: SessionService,
    private val sessionManagementService: SessionManagementService,
    private val webSocketSessionManager: WebSocketSessionManager,
    private val gamePlayService: GamePlayService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    @Transactional
    fun joinGame(request: JoinGameRequest, session: HttpSession): GameStateResponse {
        logger.debug("Join game request - gameNumber={}, sessionId={}", request.gameNumber, session.id)
        val userId = sessionService.getOptionalUserId(session)
        val nickname = sessionService.getOptionalUserNickname(session)
        logger.debug("Session identified userId={}, nickname={}", userId, nickname)

        val game = gameRepository.findByGameNumberWithLock(request.gameNumber)
            ?: throw GameNotFoundException(request.gameNumber)

        if (game.gameState != GameState.WAITING) {
            throw GameAlreadyStartedException(request.gameNumber)
        }

        val currentPlayers = playerRepository.findByGame(game)
        if (currentPlayers.size >= game.gameParticipants) {
            throw RoomFullException(request.gameNumber)
        }

        val currentUserId = sessionService.getCurrentUserId(session)
        val currentNickname = sessionService.getCurrentUserNickname(session)
        logger.debug("Validated session for user {} ({})", currentNickname, currentUserId)

        runCatching { sessionManagementService.validateSession(session) }
            .onFailure { logger.warn("Session validation failed during joinGame: {}", it.message) }

        val existingPlayer = playerRepository.findByGameAndUserId(game, currentUserId)
        if (existingPlayer != null) {
            val isOwner = game.gameOwner == currentNickname
            sessionManagementService.updateGameSession(session, request.gameNumber, isOwner, if (isOwner) "OWNER" else "PLAYER")
            registerPlayerSession(currentUserId, request.gameNumber)
            logger.debug("Player {} already in game {}, returning latest state", currentUserId, request.gameNumber)
            return gamePlayService.buildGameState(game, session)
        }

        val newPlayer = createPlayer(game, currentUserId, currentNickname)
        val savedPlayer = playerRepository.save(newPlayer)
        logger.debug("Added player {} to game {}", savedPlayer.id, request.gameNumber)

        val isOwner = game.gameOwner == currentNickname
        sessionManagementService.updateGameSession(session, request.gameNumber, isOwner, if (isOwner) "OWNER" else "PLAYER")
        registerPlayerSession(currentUserId, request.gameNumber)

        val allPlayers = playerRepository.findByGame(game)
        gameMonitoringService.notifyPlayerJoined(game, savedPlayer, allPlayers)

        return gamePlayService.buildGameState(game, session)
    }

    @Transactional
    fun leaveGame(request: LeaveGameRequest, session: HttpSession): Boolean {
        val game = gameRepository.findByGameNumberWithLock(request.gameNumber)
            ?: throw GameNotFoundException(request.gameNumber)

        val userId = sessionService.getCurrentUserId(session)
        val nickname = sessionService.getCurrentUserNickname(session)
        val player = playerRepository.findByGameAndUserId(game, userId) ?: return false

        archivePlayerChat(player)

        val deletedCount = playerRepository.deleteByGameIdAndUserId(game.id, userId)
        if (deletedCount == 0) {
            return false
        }

        val readinessDeleted = playerReadinessRepository.deleteByGameAndUserId(game, userId)
        if (readinessDeleted > 0) {
            logger.debug("Removed {} readiness records for player {} in game {}", readinessDeleted, userId, game.gameNumber)
        }

        refreshSessionAfterLeaving(session, nickname, userId)
        webSocketSessionManager.removePlayerFromGame(userId)

        val remainingPlayers = playerRepository.findByGame(game)
        val wasOwner = game.gameOwner == nickname

        if (remainingPlayers.isEmpty()) {
            logger.debug("No players remaining, deleting room {}", game.gameNumber)
            deleteGameCompletely(game)
            return true
        }

        if (wasOwner) {
            val newOwner = remainingPlayers.minByOrNull { it.joinedAt }
            if (newOwner != null) {
                game.gameOwner = newOwner.nickname
                gameRepository.save(game)
                logger.debug("Transferred ownership from {} to {} in room {}", nickname, newOwner.nickname, game.gameNumber)
            }
        }

        gameMonitoringService.notifyPlayerLeft(game, player, remainingPlayers)
        return true
    }

    @Transactional(readOnly = true)
    fun findPlayerInActiveGame(userId: Long): PlayerEntity? {
        return playerRepository.findByUserIdAndGameActive(userId)
    }

    @Transactional
    fun cleanupPlayerByUserId(userId: Long) {
        try {
            val player = playerRepository.findByUserIdAndGameActive(userId)
            if (player != null) {
                leaveGameAsSystem(player.game.gameNumber, userId)
                logger.info("Cleaned up player {} from game {}", userId, player.game.gameNumber)
            } else {
                logger.debug("No active player found for user {}", userId)
            }
        } catch (ex: Exception) {
            logger.error("Error during player cleanup for user {}: {}", userId, ex.message)
        }
    }

    @Transactional
    fun leaveGameAsSystem(gameNumber: Int, userId: Long) {
        val game = gameRepository.findByGameNumberWithLock(gameNumber) ?: return
        val player = playerRepository.findByGameAndUserId(game, userId) ?: return

        archivePlayerChat(player)
        playerRepository.delete(player)

        val readinessDeleted = playerReadinessRepository.deleteByGameAndUserId(game, userId)
        if (readinessDeleted > 0) {
            logger.debug("System cleanup removed {} readiness records for user {} in game {}", readinessDeleted, userId, game.gameNumber)
        }

        val remainingPlayers = playerRepository.findByGame(game)
        if (remainingPlayers.isEmpty()) {
            deleteGameCompletely(game)
        } else {
            if (game.gameOwner == player.nickname) {
                val newOwner = remainingPlayers.minByOrNull { it.joinedAt }
                newOwner?.let {
                    game.gameOwner = it.nickname
                    gameRepository.save(game)
                }
            }
            gameMonitoringService.notifyPlayerLeft(game, player, remainingPlayers)
        }
    }

    @Transactional
    fun handlePlayerDisconnection(userId: Long) {
        val player = playerRepository.findByUserIdAndGameActive(userId)
        player?.let {
            logger.debug("Handling player disconnection: userId={}, gameNumber={}, nickname={}", userId, it.game.gameNumber, it.nickname)
            it.isOnline = false
            it.lastActiveAt = Instant.now()
            playerRepository.save(it)
            gameMonitoringService.notifyPlayerConnectionChanged(it.game, it, isConnected = false)
        }
    }

    @Transactional
    fun handlePlayerReconnection(userId: Long) {
        val player = playerRepository.findByUserIdAndGameActive(userId)
        player?.let {
            logger.debug("Handling player reconnection: userId={}, gameNumber={}, nickname={}", userId, it.game.gameNumber, it.nickname)
            it.isOnline = true
            it.lastActiveAt = Instant.now()
            playerRepository.save(it)
            gameMonitoringService.notifyPlayerConnectionChanged(it.game, it, isConnected = true)
        }
    }

    @Transactional
    fun kickOwnerAndTransferOwnership(gameNumber: Int): OwnerKickResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)

        if (game.gameState != GameState.WAITING) {
            throw IllegalArgumentException("대기 중인 게임방에서만 방장 강퇴가 가능합니다.")
        }

        val playerCount = playerRepository.countByGame(game)
        if (playerCount < 2) {
            throw IllegalArgumentException("플레이어가 2명 이상 있어야 방장 강퇴가 가능합니다.")
        }

        val players = playerRepository.findByGame(game)
        val currentOwner = players.find { it.nickname == game.gameOwner }
            ?: throw IllegalArgumentException("현재 방장을 찾을 수 없습니다.")

        val nextOwner = players.filter { it.nickname != game.gameOwner }
            .minByOrNull { it.joinedAt }
            ?: throw IllegalArgumentException("새로운 방장을 선정할 수 없습니다.")

        logger.info("방장 강퇴 및 권한 이양: 게임={}, 기존방장={}, 새방장={}", gameNumber, currentOwner.nickname, nextOwner.nickname)

        val previousOwner = game.gameOwner
        game.gameOwner = nextOwner.nickname
        gameRepository.save(game)

        chatService.archivePlayerChatMessages(currentOwner.userId, currentOwner.nickname)
        playerRepository.delete(currentOwner)

        val message = mapOf(
            "type" to "OWNER_KICKED_AND_TRANSFERRED",
            "kickedOwner" to previousOwner,
            "newOwner" to nextOwner.nickname,
            "message" to "$previousOwner 님이 시간 내에 게임을 시작하지 않아 강퇴되었습니다. 새로운 방장은 ${nextOwner.nickname}님입니다."
        )
        gameMonitoringService.broadcastEvent(gameNumber, message)
        chatService.sendSystemMessage(game, "${previousOwner}님이 방장 권한을 박탈당했습니다. 새로운 방장: ${nextOwner.nickname}님")

        return OwnerKickResponse(
            newOwner = nextOwner.nickname,
            kickedPlayer = previousOwner,
            gameNumber = gameNumber
        )
    }

    @Transactional
    fun cleanupStaleGameData(userId: Long, nickname: String): Boolean {
        logger.info("Starting stale game data cleanup for user {} ({})", nickname, userId)
        return try {
            val ownedGame = gameRepository.findByGameOwnerAndGameStateIn(
                nickname,
                listOf(GameState.WAITING, GameState.IN_PROGRESS)
            )

            if (ownedGame != null) {
                val gameAge = java.time.Duration.between(ownedGame.createdAt, java.time.LocalDateTime.now())
                val lastActivity = ownedGame.lastActivityAt
                    ?: ownedGame.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant()
                val inactiveTime = java.time.Duration.between(lastActivity, Instant.now())

                if (gameAge.toMinutes() > 5 || inactiveTime.toMinutes() > 3) {
                    logger.info("Cleaning up stale owned game {}", ownedGame.gameNumber)
                    leaveGameAsSystem(ownedGame.gameNumber, userId)
                }
            }

            val stalePlayerGame = playerRepository.findByUserIdAndGameActive(userId)
            if (stalePlayerGame != null) {
                val game = stalePlayerGame.game
                val gameAge = java.time.Duration.between(game.createdAt, java.time.LocalDateTime.now())
                val lastActivity = game.lastActivityAt
                    ?: game.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant()
                val inactiveTime = java.time.Duration.between(lastActivity, Instant.now())

                if (gameAge.toMinutes() > 5 || inactiveTime.toMinutes() > 3) {
                    logger.info("Cleaning up stale player participation in game {}", game.gameNumber)
                    leaveGameAsSystem(game.gameNumber, userId)
                }
            }

            true
        } catch (ex: Exception) {
            logger.error("Error during stale game data cleanup for user {}: {}", nickname, ex.message)
            false
        }
    }

    private fun createPlayer(game: GameEntity, userId: Long, nickname: String): PlayerEntity {
        val subject = game.citizenSubject ?: throw IllegalStateException("게임에 시민 주제가 설정되지 않았습니다.")
        game.lastActivityAt = Instant.now()
        gameRepository.save(game)

        return PlayerEntity(
            game = game,
            userId = userId,
            nickname = nickname,
            isAlive = true,
            role = PlayerRole.CITIZEN,
            subject = subject,
            state = PlayerState.WAITING_FOR_HINT,
            votesReceived = 0,
            hint = null,
            defense = null,
            votedFor = null
        )
    }

    private fun archivePlayerChat(player: PlayerEntity) {
        try {
            val archivedCount = chatService.archivePlayerChatMessages(player.userId, player.nickname)
            logger.debug("Archived {} chat messages for player {} in game {}", archivedCount, player.nickname, player.game.gameNumber)
        } catch (ex: Exception) {
            logger.error("Failed to archive chat messages for player {}: {}", player.nickname, ex.message)
            throw ChatArchivalException(player.nickname)
        }
    }

    private fun deleteGameCompletely(game: GameEntity) {
        try {
            chatService.deleteGameChatMessages(game)
            val gameSubjects = gameSubjectRepository.findByGame(game)
            if (gameSubjects.isNotEmpty()) {
                gameSubjectRepository.deleteAll(gameSubjects)
                logger.debug("Deleted {} game_subject records for game {}", gameSubjects.size, game.gameNumber)
            }
            gameRepository.delete(game)
            gameMonitoringService.notifyRoomDeleted(game.gameNumber)
        } catch (ex: Exception) {
            logger.error("Failed to delete game {}: {}", game.gameNumber, ex.message)
            throw GameCleanupException("게임방 삭제 중 오류가 발생했습니다: ${ex.message}")
        }
    }

    private fun registerPlayerSession(userId: Long, gameNumber: Int) {
        runCatching { webSocketSessionManager.registerPlayerInGame(userId, gameNumber) }
            .onFailure { logger.warn("Failed to register WebSocket session for player {}: {}", userId, it.message) }
    }

    private fun refreshSessionAfterLeaving(session: HttpSession, nickname: String, userId: Long) {
        runCatching {
            sessionManagementService.updateGameSession(session, null, false, null)
            sessionManagementService.validateSession(session)
        }.onFailure {
            logger.warn("Session refresh failed during leaveGame for user {} ({}): {}", nickname, userId, it.message)
        }
    }
}
