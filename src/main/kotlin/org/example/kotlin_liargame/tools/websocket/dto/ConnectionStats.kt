package org.example.kotlin_liargame.tools.websocket.dto

data class ConnectionStats(
    val totalConnections: Int,
    val activeConnections: Int,
    val disconnectedConnections: Int,
    val timeoutConnections: Int,
    val failedConnections: Int,
    val averageConnectionDuration: Double
)