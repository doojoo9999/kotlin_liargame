package org.example.kotlin_liargame.tools.websocket

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.game.service.GamePlayerService
import org.example.kotlin_liargame.global.connection.service.EnhancedConnectionService
import org.example.kotlin_liargame.tools.websocket.dto.ConnectionMessage
import org.example.kotlin_liargame.tools.websocket.dto.ConnectionState
import org.example.kotlin_liargame.tools.websocket.dto.ConnectionStats
import org.example.kotlin_liargame.tools.websocket.dto.HeartbeatMessage
import org.example.kotlin_liargame.tools.websocket.enum.ConnectionStatus
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Lazy
import org.springframework.context.event.EventListener
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.TaskScheduler
import org.springframework.security.web.session.HttpSessionDestroyedEvent
import org.springframework.stereotype.Component
import org.springframework.web.socket.CloseStatus
import java.time.Duration
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ScheduledFuture

@Component
class WebSocketConnectionManager(
    @Lazy private val messagingTemplate: SimpMessagingTemplate,
    private val taskScheduler: TaskScheduler,
    @Lazy private val gamePlayerService: GamePlayerService,
    @Lazy private val enhancedConnectionService: EnhancedConnectionService,
    @Lazy private val webSocketSessionManager: WebSocketSessionManager
) {
    private val logger = LoggerFactory.getLogger(WebSocketConnectionManager::class.java)

    private val connectionStates = ConcurrentHashMap<String, ConnectionState>()
    private val heartbeatTasks = ConcurrentHashMap<String, ScheduledFuture<*>>()
    private val disconnectFinalizers = ConcurrentHashMap<String, ScheduledFuture<*>>()
    private val reconnectionAttempts = ConcurrentHashMap<String, Int>()

    companion object {
        private const val HEARTBEAT_INTERVAL_SECONDS = 10L
        private const val CONNECTION_TIMEOUT_SECONDS = 30L
        private const val MAX_RECONNECTION_ATTEMPTS = 3
    }

    fun registerConnection(sessionId: String, userId: Long?) {
        if (userId == null) {
            logger.warn("Ignoring connection registration for {} without resolved userId", sessionId)
            return
        }

        cancelFinalizer(sessionId)

        val connectionState = ConnectionState(
            sessionId = sessionId,
            userId = userId,
            connectedAt = Instant.now(),
            lastHeartbeat = Instant.now(),
            status = ConnectionStatus.CONNECTED
        )

        connectionStates[sessionId] = connectionState
        startHeartbeatMonitoring(sessionId)

        logger.info("[CONNECTION] Registered session {} for user {}", sessionId, userId)
        sendConnectionUpdate(
            userId,
            ConnectionMessage(
                type = "CONNECTION_ESTABLISHED",
                message = "연결이 성공적으로 설정되었습니다.",
                timestamp = Instant.now()
            )
        )
    }

    fun handleDisconnection(sessionId: String) {
        val connectionState = connectionStates[sessionId]
        if (connectionState == null) {
            logger.debug("Received disconnection for unknown session {}", sessionId)
            return
        }

        logger.info(
            "[CONNECTION] WebSocket disconnected: {} (userId: {})",
            sessionId,
            connectionState.userId
        )

        connectionState.status = ConnectionStatus.DISCONNECTED
        connectionState.disconnectedAt = Instant.now()
        heartbeatTasks.remove(sessionId)?.cancel(false)

        connectionState.userId?.let { userId ->
            runCatching { gamePlayerService.handlePlayerDisconnection(userId) }
                .onFailure { logger.error("Failed to mark user {} as disconnected", userId, it) }

            runCatching {
                gamePlayerService.findPlayerInActiveGame(userId)?.let { player ->
                    enhancedConnectionService.handleDisconnection(userId, player.game.gameNumber)
                }
            }.onFailure { logger.error("Enhanced disconnection handling failed for user {}", userId, it) }
        }

        scheduleFinalization(sessionId)
    }

    fun handleHeartbeat(sessionId: String) {
        val connectionState = connectionStates[sessionId] ?: return
        connectionState.lastHeartbeat = Instant.now()
        connectionState.status = ConnectionStatus.CONNECTED
        reconnectionAttempts.remove(sessionId)

        connectionState.userId?.let { userId ->
            sendHeartbeat(userId, HeartbeatMessage("HEARTBEAT_RESPONSE", Instant.now(), Instant.now()))
        }
    }

    fun handleReconnection(oldSessionId: String, newSessionId: String, userId: Long?): Boolean {
        if (userId == null) {
            logger.warn("Rejecting reconnection attempt without userId (old={}, new={})", oldSessionId, newSessionId)
            return false
        }

        val oldConnection = connectionStates[oldSessionId]
        if (oldConnection == null || oldConnection.userId != userId) {
            logger.debug("No matching previous connection for reconnection {} -> {} (userId={})", oldSessionId, newSessionId, userId)
            return false
        }

        cancelFinalizer(oldSessionId)

        val newConnection = oldConnection.copy(
            sessionId = newSessionId,
            status = ConnectionStatus.RECONNECTED,
            reconnectedAt = Instant.now(),
            lastHeartbeat = Instant.now(),
            disconnectedAt = null
        )

        connectionStates.remove(oldSessionId)
        connectionStates[newSessionId] = newConnection
        heartbeatTasks.remove(oldSessionId)?.cancel(false)
        startHeartbeatMonitoring(newSessionId)

        reconnectionAttempts.remove(oldSessionId)

        logger.info("[CONNECTION] Reconnection successful: {} -> {} (userId: {})", oldSessionId, newSessionId, userId)
        sendConnectionUpdate(
            userId,
            ConnectionMessage(
                type = "RECONNECTION_SUCCESS",
                message = "연결이 성공적으로 복구되었습니다.",
                timestamp = Instant.now()
            )
        )

        runCatching { gamePlayerService.handlePlayerReconnection(userId) }
            .onFailure { logger.error("Failed to mark user {} as reconnected", userId, it) }

        runCatching {
            gamePlayerService.findPlayerInActiveGame(userId)?.let { player ->
                enhancedConnectionService.handleReconnection(userId, player.game.gameNumber)
            }
        }.onFailure { logger.error("Enhanced reconnection handling failed for user {}", userId, it) }

        return true
    }

    fun getConnectionState(sessionId: String): ConnectionState? = connectionStates[sessionId]

    fun getUserConnections(userId: Long): List<ConnectionState> = connectionStates.values.filter { state ->
        state.userId == userId && state.status != ConnectionStatus.FAILED
    }

    fun isUserConnected(userId: Long): Boolean = getUserConnections(userId).any { it.status == ConnectionStatus.CONNECTED }

    fun sendToUser(userId: Long, destination: String, payload: Any) {
        messagingTemplate.convertAndSendToUser(userId.toString(), destination, payload)
    }

    fun updateLastActivity(sessionId: String) {
        val connectionState = connectionStates[sessionId]
        if (connectionState != null) {
            connectionState.lastHeartbeat = Instant.now()
            connectionState.status = ConnectionStatus.CONNECTED
        }
    }

    fun getConnectionStats(): ConnectionStats {
        val now = Instant.now()
        val connections = connectionStates.values

        return ConnectionStats(
            totalConnections = connections.size,
            activeConnections = connections.count { it.status == ConnectionStatus.CONNECTED },
            disconnectedConnections = connections.count { it.status == ConnectionStatus.DISCONNECTED },
            timeoutConnections = connections.count { it.status == ConnectionStatus.TIMEOUT },
            failedConnections = connections.count { it.status == ConnectionStatus.FAILED },
            averageConnectionDuration = connections.mapNotNull { state ->
                val endTime = state.disconnectedAt ?: now
                Duration.between(state.connectedAt, endTime).seconds
            }.takeIf { it.isNotEmpty() }?.average() ?: 0.0
        )
    }

    @EventListener
    fun handleHttpSessionDestroyed(event: HttpSessionDestroyedEvent) {
        val session = event.session ?: return
        cleanupSocketsForHttpSession(session)
    }

    private fun cleanupSocketsForHttpSession(httpSession: HttpSession) {
        val httpSessionId = httpSession.id
        val sessionIds = webSocketSessionManager.getSessionIdsByHttpSessionId(httpSessionId)
        if (sessionIds.isEmpty()) {
            return
        }

        sessionIds.forEach { sessionId ->
            val closed = webSocketSessionManager.closeNativeSession(sessionId, CloseStatus.SESSION_NOT_RELIABLE)
            handleDisconnection(sessionId)

            if (closed) {
                logger.info(
                    "[CONNECTION] Closed WebSocket session {} due to HTTP session logout/expiry ({})",
                    sessionId,
                    httpSessionId
                )
            }
        }
    }

    private fun startHeartbeatMonitoring(sessionId: String) {
        val heartbeatTask = taskScheduler.scheduleAtFixedRate(
            { checkConnectionHealth(sessionId) },
            Instant.now().plusSeconds(HEARTBEAT_INTERVAL_SECONDS),
            Duration.ofSeconds(HEARTBEAT_INTERVAL_SECONDS)
        )
        heartbeatTasks[sessionId] = heartbeatTask
    }

    private fun checkConnectionHealth(sessionId: String) {
        val connectionState = connectionStates[sessionId] ?: return
        val userId = connectionState.userId ?: return

        val now = Instant.now()
        val timeSinceLastHeartbeat = Duration.between(connectionState.lastHeartbeat, now).seconds

        if (timeSinceLastHeartbeat > CONNECTION_TIMEOUT_SECONDS) {
            connectionState.status = ConnectionStatus.TIMEOUT
            logger.warn("[CONNECTION] Timeout detected for session {} (userId={})", sessionId, userId)
            triggerReconnection(sessionId, userId)
            scheduleFinalization(sessionId)
        } else {
            sendHeartbeat(
                userId,
                HeartbeatMessage(
                    type = "HEARTBEAT_PING",
                    timestamp = now,
                    serverTime = now
                )
            )
        }
    }

    private fun triggerReconnection(sessionId: String, userId: Long) {
        val attempts = reconnectionAttempts.getOrDefault(sessionId, 0)
        if (attempts >= MAX_RECONNECTION_ATTEMPTS) {
            logger.warn("[CONNECTION] Max reconnection attempts reached for session {}", sessionId)
            connectionStates[sessionId]?.status = ConnectionStatus.FAILED
            scheduleFinalization(sessionId)
            return
        }

        reconnectionAttempts[sessionId] = attempts + 1
        sendConnectionUpdate(
            userId,
            ConnectionMessage(
                type = "RECONNECTION_REQUIRED",
                message = "연결이 끊어졌습니다. 재연결을 시도합니다...",
                timestamp = Instant.now()
            )
        )
    }

    private fun scheduleFinalization(sessionId: String) {
        cancelFinalizer(sessionId)
        val task = taskScheduler.schedule({ finalizeDisconnection(sessionId) }, Instant.now().plusSeconds(CONNECTION_TIMEOUT_SECONDS))
        disconnectFinalizers[sessionId] = task
    }

    private fun finalizeDisconnection(sessionId: String) {
        val connectionState = connectionStates[sessionId] ?: return
        if (connectionState.status == ConnectionStatus.RECONNECTED || connectionState.status == ConnectionStatus.CONNECTED) {
            return
        }

        val userId = connectionState.userId
        cleanupConnectionState(sessionId)

        if (userId != null) {
            logger.info("[CONNECTION] Finalizing disconnection for user {} (session {})", userId, sessionId)
            sendConnectionUpdate(
                userId,
                ConnectionMessage(
                    type = "CONNECTION_CLOSED",
                    message = "연결이 종료되었습니다.",
                    timestamp = Instant.now()
                )
            )
        }
    }

    private fun cleanupConnectionState(sessionId: String) {
        connectionStates.remove(sessionId)
        heartbeatTasks.remove(sessionId)?.cancel(false)
        cancelFinalizer(sessionId)
        reconnectionAttempts.remove(sessionId)
        webSocketSessionManager.removeSession(sessionId)
    }

    private fun cancelFinalizer(sessionId: String) {
        disconnectFinalizers.remove(sessionId)?.cancel(false)
    }

    private fun sendConnectionUpdate(userId: Long, message: ConnectionMessage) {
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/connection", message)
    }

    private fun sendHeartbeat(userId: Long, message: HeartbeatMessage) {
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/heartbeat", message)
    }
}

