package org.example.kotlin_liargame.tools.scheduler

import org.example.kotlin_liargame.domain.auth.service.AuthService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
@EnableScheduling
class TokenCleanupScheduler(
    private val authService: AuthService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    //60분마다 token cleanup
    @Scheduled(fixedRate = 60 * 60 * 1000)
    fun cleanupExpiredTokens() {
        logger.info("Starting scheduled cleanup of expired tokens")
        try {
            authService.cleanupExpiredTokens()
            logger.info("Completed scheduled cleanup of expired tokens")
        } catch (e: Exception) {
            logger.error("Error during scheduled cleanup of expired tokens", e)
        }
    }
}