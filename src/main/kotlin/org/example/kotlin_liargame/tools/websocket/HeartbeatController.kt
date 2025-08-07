package org.example.kotlin_liargame.tools.websocket

import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.stereotype.Controller

@Controller
class HeartbeatController(
    private val connectionManager: WebSocketConnectionManager
) {
    
    @MessageMapping("/heartbeat")
    fun handleHeartbeat(accessor: SimpMessageHeaderAccessor) {
        val sessionId = accessor.sessionId
        if (sessionId != null) {
            connectionManager.handleHeartbeat(sessionId)
            println("[HEARTBEAT] Received heartbeat from session: $sessionId")
        } else {
            println("[HEARTBEAT] Received heartbeat without session ID")
        }
    }
}