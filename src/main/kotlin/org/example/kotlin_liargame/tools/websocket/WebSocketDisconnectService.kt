package org.example.kotlin_liargame.tools.websocket

import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Lazy
import org.springframework.stereotype.Service
import org.springframework.web.socket.CloseStatus

@Service
class WebSocketDisconnectService(
    private val webSocketSessionManager: WebSocketSessionManager,
    @Lazy private val connectionManager: WebSocketConnectionManager
) {

    private val logger = LoggerFactory.getLogger(WebSocketDisconnectService::class.java)

    fun disconnectByHttpSessionId(httpSessionId: String) {
        val sessionIds = webSocketSessionManager.getSessionIdsByHttpSessionId(httpSessionId)
        if (sessionIds.isEmpty()) {
            logger.debug("No WebSocket sessions mapped to HTTP session {}", httpSessionId)
            return
        }

        sessionIds.forEach { disconnectSession(it, CloseStatus.NORMAL) }
    }

    fun disconnectByUserId(userId: Long) {
        val sessionIds = webSocketSessionManager.getSessionsForUser(userId)
        if (sessionIds.isEmpty()) {
            logger.debug("No WebSocket sessions found for user {}", userId)
            return
        }

        sessionIds.forEach { disconnectSession(it, CloseStatus.NORMAL) }
    }

    fun disconnectSession(sessionId: String, closeStatus: CloseStatus = CloseStatus.NORMAL) {
        val closed = webSocketSessionManager.closeNativeSession(sessionId, closeStatus)
        connectionManager.handleDisconnection(sessionId)

        if (closed) {
            logger.info("Force closed WebSocket session {} with status {}", sessionId, closeStatus.code)
        } else {
            logger.debug("Attempted to close already terminated WebSocket session {}", sessionId)
        }
    }
}
