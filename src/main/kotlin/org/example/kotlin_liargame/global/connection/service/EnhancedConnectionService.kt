package org.example.kotlin_liargame.global.connection.service

import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.game.service.GameMonitoringService
import org.example.kotlin_liargame.domain.game.service.GameService
import org.example.kotlin_liargame.global.connection.dto.ConnectionStability
import org.example.kotlin_liargame.global.connection.dto.PlayerConnectionStatus
import org.example.kotlin_liargame.global.connection.model.ConnectionLogEntity
import org.example.kotlin_liargame.global.connection.repository.ConnectionLogRepository
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Lazy
import org.springframework.scheduling.TaskScheduler
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ScheduledFuture

@Service
@Transactional
class EnhancedConnectionService(
    private val connectionLogRepository: ConnectionLogRepository,
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val gameMonitoringService: GameMonitoringService,
    private val taskScheduler: TaskScheduler,
    @Lazy private val gameService: GameService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    private val gracePeriodsMap = ConcurrentHashMap<Long, ScheduledFuture<*>>()

    fun handleDisconnection(userId: Long, gameNumber: Int) {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return
        val player = playerRepository.findByGameAndUserId(game, userId) ?: return

        connectionLogRepository.save(
            ConnectionLogEntity(
                userId = userId,
                gameId = game.id,
                action = org.example.kotlin_liargame.global.connection.model.ConnectionAction.DISCONNECT,
                sessionId = null
            )
        )

        val hasInProgress = game.gameState == GameState.IN_PROGRESS
        if (hasInProgress) {
            startGracePeriod(userId, gameNumber)
        } else {
            // 대기 중이면 단순 알림만 브로드캐스트
            val payload = mapOf(
                "type" to "PLAYER_DISCONNECTED",
                "gameNumber" to gameNumber,
                "userId" to userId,
                "nickname" to player.nickname,
                "hasGracePeriod" to false
            )
            gameMonitoringService.broadcastGameState(game, payload)
        }
    }

    fun handleReconnection(userId: Long, gameNumber: Int) {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return
        val player = playerRepository.findByGameAndUserId(game, userId) ?: return

        gracePeriodsMap[userId]?.cancel(true)
        gracePeriodsMap.remove(userId)

        connectionLogRepository.save(
            ConnectionLogEntity(
                userId = userId,
                gameId = game.id,
                action = org.example.kotlin_liargame.global.connection.model.ConnectionAction.RECONNECT
            )
        )

        val payload = mapOf(
            "type" to "PLAYER_RECONNECTED",
            "gameNumber" to gameNumber,
            "userId" to userId,
            "nickname" to player.nickname
        )
        gameMonitoringService.broadcastGameState(game, payload)
    }

    private fun startGracePeriod(userId: Long, gameNumber: Int) {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return
        val gracePeriodSeconds = 30L

        connectionLogRepository.save(
            ConnectionLogEntity(
                userId = userId,
                gameId = game.id,
                action = org.example.kotlin_liargame.global.connection.model.ConnectionAction.GRACE_PERIOD_STARTED,
                gracePeriodSeconds = gracePeriodSeconds.toInt()
            )
        )

        val payload = mapOf(
            "type" to "GRACE_PERIOD_STARTED",
            "gameNumber" to gameNumber,
            "userId" to userId,
            "seconds" to gracePeriodSeconds
        )
        gameMonitoringService.broadcastGameState(game, payload)

        val graceTask = taskScheduler.schedule({ handleGracePeriodExpired(userId, gameNumber) }, Instant.now().plusSeconds(gracePeriodSeconds))
        gracePeriodsMap[userId] = graceTask
    }

    private fun handleGracePeriodExpired(userId: Long, gameNumber: Int) {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return
        gracePeriodsMap.remove(userId)

        connectionLogRepository.save(
            ConnectionLogEntity(
                userId = userId,
                gameId = game.id,
                action = org.example.kotlin_liargame.global.connection.model.ConnectionAction.GRACE_PERIOD_EXPIRED
            )
        )

        val payload = mapOf(
            "type" to "GRACE_PERIOD_EXPIRED",
            "gameNumber" to gameNumber,
            "userId" to userId
        )
        gameMonitoringService.broadcastGameState(game, payload)

        runCatching { gameService.cleanupPlayerByUserId(userId) }
            .onFailure { logger.error("Failed to clean up player {} after grace period", userId, it) }
    }

    fun getConnectionStatus(gameNumber: Int): List<PlayerConnectionStatus> {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return emptyList()
        val players = playerRepository.findByGame(game)

        return players.map { player ->
            val hasActiveGracePeriod = gracePeriodsMap.containsKey(player.userId)
            val lastConnection = connectionLogRepository.findTopByUserIdOrderByTimestampDesc(player.userId)

            PlayerConnectionStatus(
                userId = player.userId,
                nickname = player.nickname,
                isConnected = !hasActiveGracePeriod && (lastConnection?.action != org.example.kotlin_liargame.global.connection.model.ConnectionAction.DISCONNECT),
                hasGracePeriod = hasActiveGracePeriod,
                lastSeenAt = lastConnection?.timestamp ?: Instant.now(),
                connectionStability = calculateConnectionStability(player.userId)
            )
        }
    }

    private fun calculateConnectionStability(userId: Long): ConnectionStability {
        val recentLogs = connectionLogRepository.findByUserIdAndTimestampAfter(
            userId,
            Instant.now().minus(Duration.ofHours(1))
        )
        val disconnectCount = recentLogs.count { it.action == org.example.kotlin_liargame.global.connection.model.ConnectionAction.DISCONNECT }
        return when {
            disconnectCount == 0 -> ConnectionStability.STABLE
            disconnectCount < 3 -> ConnectionStability.UNSTABLE
            else -> ConnectionStability.POOR
        }
    }
}
