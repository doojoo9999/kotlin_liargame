package org.example.kotlin_liargame.global.connection.dto

import java.time.Instant

data class PlayerConnectionStatus(
    val userId: Long,
    val nickname: String,
    val isConnected: Boolean,
    val hasGracePeriod: Boolean,
    val lastSeenAt: Instant,
    val connectionStability: ConnectionStability
)

enum class ConnectionStability { STABLE, UNSTABLE, POOR }

