package org.example.kotlin_liargame.tools.websocket.dto

import java.time.Instant

data class HeartbeatMessage(
    val type: String,
    val timestamp: Instant,
    val serverTime: Instant
)