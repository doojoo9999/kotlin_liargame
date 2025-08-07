package org.example.kotlin_liargame.tools.websocket.dto

import org.example.kotlin_liargame.tools.websocket.enum.ConnectionStatus
import java.time.Instant

data class ConnectionState(
    val sessionId: String,
    val userId: Long?,
    val connectedAt: Instant,
    var lastHeartbeat: Instant,
    var status: ConnectionStatus,
    var disconnectedAt: Instant? = null,
    var reconnectedAt: Instant? = null
)
