package org.example.kotlin_liargame.global.security

import jakarta.servlet.http.HttpSessionEvent
import jakarta.servlet.http.HttpSessionListener
import org.example.kotlin_liargame.domain.game.service.GameService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class SessionLifecycleListener(
    private val sessionManagementService: SessionManagementService,
    private val gameService: GameService
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

            try {
                gameService.cleanupPlayerByUserId(sessionInfo.userId)
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
        }
    }
}
