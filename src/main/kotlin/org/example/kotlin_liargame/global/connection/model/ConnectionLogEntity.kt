package org.example.kotlin_liargame.global.connection.model

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "connection_logs")
data class ConnectionLogEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "user_id", nullable = false)
    val userId: Long,

    @Column(name = "game_id")
    val gameId: Long?,

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false)
    val action: ConnectionAction,

    @Column(name = "timestamp", nullable = false)
    val timestamp: Instant = Instant.now(),

    @Column(name = "session_id")
    val sessionId: String? = null,

    @Column(name = "grace_period_seconds")
    val gracePeriodSeconds: Int = 30
)

enum class ConnectionAction {
    CONNECT, DISCONNECT, RECONNECT, GRACE_PERIOD_STARTED, GRACE_PERIOD_EXPIRED
}

