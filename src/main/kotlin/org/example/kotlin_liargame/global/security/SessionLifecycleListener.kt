package org.example.kotlin_liargame.global.security

import jakarta.servlet.http.HttpSessionEvent
import jakarta.servlet.http.HttpSessionListener
import org.example.kotlin_liargame.domain.game.service.GamePlayerService
import org.example.kotlin_liargame.tools.websocket.WebSocketDisconnectService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class SessionLifecycleListener(
    private val sessionManagementService: SessionManagementService,
    private val gamePlayerService: GamePlayerService,
    private val webSocketDisconnectService: WebSocketDisconnectService
) : HttpSessionListener {

    private val logger = LoggerFactory.getLogger(SessionLifecycleListener::class.java)

    override fun sessionCreated(se: HttpSessionEvent?) {
        // no-op
    }

    override fun sessionDestroyed(se: HttpSessionEvent?) {
        val session = se?.session ?: return
        val sessionId = session.id

        val sessionInfo = sessionManagementService.getSessionInfoById(sessionId)

        if (sessionInfo != null) {
            sessionManagementService.invalidateSession(sessionInfo.nickname)
            webSocketDisconnectService.disconnectByUserId(sessionInfo.userId)

            try {
                gamePlayerService.cleanupPlayerByUserId(sessionInfo.userId)
            } catch (ex: Exception) {
                logger.warn(
                    "Failed to cleanup player for expired session {} (userId={}): {}",
                    sessionId,
                    sessionInfo.userId,
                    ex.message
                )
            }
        } else {
            sessionManagementService.invalidateSessionById(sessionId)
            webSocketDisconnectService.disconnectByHttpSessionId(sessionId)
        }
    }
}
