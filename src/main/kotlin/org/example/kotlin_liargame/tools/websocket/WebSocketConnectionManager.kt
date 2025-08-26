package org.example.kotlin_liargame.tools.websocket

import org.example.kotlin_liargame.domain.game.service.GameService
import org.example.kotlin_liargame.tools.websocket.dto.ConnectionMessage
import org.example.kotlin_liargame.tools.websocket.dto.ConnectionState
import org.example.kotlin_liargame.tools.websocket.dto.ConnectionStats
import org.example.kotlin_liargame.tools.websocket.dto.HeartbeatMessage
import org.example.kotlin_liargame.tools.websocket.enum.ConnectionStatus
import org.springframework.context.annotation.Lazy
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.TaskScheduler
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ScheduledFuture


@Component
class WebSocketConnectionManager(
    @Lazy private val messagingTemplate: SimpMessagingTemplate,
    private val taskScheduler: TaskScheduler,
    @Lazy private val gameService: GameService
) {
    
    private val connectionStates = ConcurrentHashMap<String, ConnectionState>()
    private val heartbeatTasks = ConcurrentHashMap<String, ScheduledFuture<*>>()
    private val reconnectionAttempts = ConcurrentHashMap<String, Int>()
    
    companion object {
        private const val HEARTBEAT_INTERVAL_SECONDS = 30L
        private const val CONNECTION_TIMEOUT_SECONDS = 90L
        private const val MAX_RECONNECTION_ATTEMPTS = 5
    }

    fun registerConnection(sessionId: String, userId: Long?) {
        val connectionState = ConnectionState(
            sessionId = sessionId,
            userId = userId,
            connectedAt = Instant.now(),
            lastHeartbeat = Instant.now(),
            status = ConnectionStatus.CONNECTED
        )
        
        connectionStates[sessionId] = connectionState
        startHeartbeatMonitoring(sessionId)
        
        println("[CONNECTION] Registered WebSocket connection: $sessionId (userId: $userId)")
        messagingTemplate.convertAndSendToUser(
            sessionId,
            "/topic/connection",
            ConnectionMessage(
                type = "CONNECTION_ESTABLISHED",
                message = "연결이 성공적으로 설정되었습니다.",
                timestamp = Instant.now()
            )
        )
    }

    fun handleDisconnection(sessionId: String) {
        val connectionState = connectionStates[sessionId]
        if (connectionState != null) {
            println("[CONNECTION] WebSocket disconnected: $sessionId (userId: ${connectionState.userId})")

            connectionState.userId?.let { userId ->
                val player = gameService.findPlayerInActiveGame(userId)
                player?.let {
                    gameService.handlePlayerDisconnection(userId)
                }
            }

            // 실시간 정리를 위해 3초로 단축 (10초에서 3초로)
            taskScheduler.schedule({
                cleanupConnection(sessionId)
            }, Instant.now().plusSeconds(3)) // 더 빠른 실시간 정리
        }
    }

    private fun cleanupConnection(sessionId: String) {
        val connectionState = connectionStates[sessionId]
        connectionState?.userId?.let { userId ->
            val player = gameService.findPlayerInActiveGame(userId)
            player?.let {
                // DISCONNECTED 상태 체크 없이 즉시 게임에서 제거
                gameService.leaveGameAsSystem(it.game.gameNumber, userId)
            }
        }

        connectionStates.remove(sessionId)
        heartbeatTasks[sessionId]?.cancel(false)
        heartbeatTasks.remove(sessionId)
        reconnectionAttempts.remove(sessionId)
        
        println("[CONNECTION] Cleaned up connection: $sessionId")
    }

    fun handleHeartbeat(sessionId: String) {
        val connectionState = connectionStates[sessionId]
        if (connectionState != null) {
            connectionState.lastHeartbeat = Instant.now()
            connectionState.status = ConnectionStatus.CONNECTED
            reconnectionAttempts.remove(sessionId) // Reset reconnection attempts on successful heartbeat
            
            messagingTemplate.convertAndSendToUser(
                sessionId,
                "/topic/heartbeat",
                HeartbeatMessage(
                    type = "HEARTBEAT_RESPONSE",
                    timestamp = Instant.now(),
                    serverTime = Instant.now()
                )
            )
        }
    }

    fun handleReconnection(oldSessionId: String, newSessionId: String, userId: Long?): Boolean {
        val oldConnection = connectionStates[oldSessionId]
        if (oldConnection != null && oldConnection.userId == userId) {
            val newConnection = oldConnection.copy(
                sessionId = newSessionId,
                reconnectedAt = Instant.now(),
                status = ConnectionStatus.RECONNECTED
            )
            
            connectionStates.remove(oldSessionId)
            connectionStates[newSessionId] = newConnection
            heartbeatTasks[oldSessionId]?.cancel(false)
            heartbeatTasks.remove(oldSessionId)
            startHeartbeatMonitoring(newSessionId)
            
            reconnectionAttempts.remove(oldSessionId)
            
            println("[CONNECTION] Reconnection successful: $oldSessionId -> $newSessionId (userId: $userId)")
            messagingTemplate.convertAndSendToUser(
                newSessionId,
                "/topic/connection",
                ConnectionMessage(
                    type = "RECONNECTION_SUCCESS",
                    message = "연결이 성공적으로 복구되었습니다.",
                    timestamp = Instant.now()
                )
            )
            
            userId?.let {
                gameService.handlePlayerReconnection(it)
            }

            return true
        }
        
        return false
    }

    fun getConnectionState(sessionId: String): ConnectionState? {
        return connectionStates[sessionId]
    }

    fun getUserConnections(userId: Long): List<ConnectionState> {
        return connectionStates.values.filter { 
            it.userId == userId && it.status != ConnectionStatus.DISCONNECTED 
        }
    }

    fun isUserConnected(userId: Long): Boolean {
        return getUserConnections(userId).isNotEmpty()
    }

    fun sendToUser(userId: Long, destination: String, message: Any) {
        val connections = getUserConnections(userId)
        connections.forEach { connection ->
            try {
                messagingTemplate.convertAndSendToUser(
                    connection.sessionId,
                    destination,
                    message
                )
            } catch (e: Exception) {
                println("[ERROR] Failed to send message to user $userId session ${connection.sessionId}: ${e.message}")
            }
        }
    }

    private fun startHeartbeatMonitoring(sessionId: String) {
        val heartbeatTask = taskScheduler.scheduleAtFixedRate({
            checkConnectionHealth(sessionId)
        }, Instant.now().plusSeconds(HEARTBEAT_INTERVAL_SECONDS), 
           java.time.Duration.ofSeconds(HEARTBEAT_INTERVAL_SECONDS))
        
        heartbeatTasks[sessionId] = heartbeatTask
    }

    private fun checkConnectionHealth(sessionId: String) {
        val connectionState = connectionStates[sessionId] ?: return
        
        val now = Instant.now()
        val timeSinceLastHeartbeat = java.time.Duration.between(connectionState.lastHeartbeat, now)
        
        if (timeSinceLastHeartbeat.seconds > CONNECTION_TIMEOUT_SECONDS) {
            connectionState.status = ConnectionStatus.TIMEOUT
            println("[CONNECTION] Connection timeout detected: $sessionId")
            
            triggerReconnection(sessionId)
        } else {
            try {
                messagingTemplate.convertAndSendToUser(
                    sessionId,
                    "/topic/heartbeat",
                    HeartbeatMessage(
                        type = "HEARTBEAT_PING",
                        timestamp = now,
                        serverTime = now
                    )
                )
            } catch (e: Exception) {
                println("[ERROR] Failed to send heartbeat to $sessionId: ${e.message}")
                connectionState.status = ConnectionStatus.ERROR
            }
        }
    }

    private fun triggerReconnection(sessionId: String) {
        val connectionState = connectionStates[sessionId] ?: return
        val attempts = reconnectionAttempts.getOrDefault(sessionId, 0)
        
        if (attempts < MAX_RECONNECTION_ATTEMPTS) {
            reconnectionAttempts[sessionId] = attempts + 1
            
            try {
                messagingTemplate.convertAndSendToUser(
                    sessionId,
                    "/topic/connection",
                    ConnectionMessage(
                        type = "RECONNECTION_REQUIRED",
                        message = "연결이 끊어졌습니다. 재연결을 시도합니다...",
                        timestamp = Instant.now()
                    )
                )
            } catch (e: Exception) {
                println("[ERROR] Failed to send reconnection request to $sessionId: ${e.message}")
            }
        } else {
            // Max attempts reached, mark as failed
            connectionState.status = ConnectionStatus.FAILED
            println("[CONNECTION] Max reconnection attempts reached for $sessionId")
            cleanupConnection(sessionId)
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
            averageConnectionDuration = connections.mapNotNull { connection ->
                val endTime = connection.disconnectedAt ?: now
                java.time.Duration.between(connection.connectedAt, endTime).seconds
            }.average().takeIf { !it.isNaN() } ?: 0.0
        )
    }
}