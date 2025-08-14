package org.example.kotlin_liargame.tools.websocket.dto

import java.time.Instant

data class ConnectionMessage(
    val type: String,
    val message: String,
    val timestamp: Instant
)
