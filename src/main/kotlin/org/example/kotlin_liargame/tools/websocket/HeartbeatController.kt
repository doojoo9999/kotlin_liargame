package org.example.kotlin_liargame.tools.websocket

import org.slf4j.LoggerFactory
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.stereotype.Controller

@Controller
class HeartbeatController(
    private val connectionManager: WebSocketConnectionManager
) {
    private val log = LoggerFactory.getLogger(HeartbeatController::class.java)

    @MessageMapping("/heartbeat")
    fun handleHeartbeat(accessor: SimpMessageHeaderAccessor) {
        val sessionId = accessor.sessionId
        if (sessionId != null) {
            connectionManager.handleHeartbeat(sessionId)
        } else {
            log.debug("Heartbeat without session ID")
        }
    }
}