package org.example.kotlin_liargame.tools.websocket.model

import java.security.Principal

/**
 * Represents an authenticated WebSocket/STOMP connection.
 * The principal name is set to the authenticated user id so it can be used
 * for Spring's user-destination routing (e.g. convertAndSendToUser).
 */
data class StompPrincipal(
    val userId: Long,
    val sessionId: String,
    val nickname: String? = null
) : Principal {
    override fun getName(): String = userId.toString()
}
