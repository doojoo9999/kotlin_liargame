package org.example.kotlin_liargame.tools.websocket

import org.example.kotlin_liargame.global.security.SessionManagementService
import org.slf4j.LoggerFactory
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.stereotype.Component

@Component
class WebSocketActivityInterceptor(
    private val connectionManager: WebSocketConnectionManager,
    private val sessionManagementService: SessionManagementService
) : ChannelInterceptor {

    private val logger = LoggerFactory.getLogger(WebSocketActivityInterceptor::class.java)

    override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
        val accessor = SimpMessageHeaderAccessor.wrap(message)
        val sessionId = accessor.sessionId

        // 하트비트가 아닌 다른 WebSocket 활동도 연결 활성 상태로 간주
        if (sessionId != null && !isHeartbeatMessage(accessor)) {
            try {
                connectionManager.updateLastActivity(sessionId)
                val userId = accessor.sessionAttributes?.get("userId") as? Long
                if (userId != null) {
                    sessionManagementService.markUserActivity(userId)
                }
            } catch (e: Exception) {
                logger.error("Error updating activity for session {}: {}", sessionId, e.message, e)
            }
        }

        return message
    }

    private fun isHeartbeatMessage(accessor: SimpMessageHeaderAccessor): Boolean {
        val destination = accessor.destination
        return destination?.contains("/heartbeat") == true
    }
}
