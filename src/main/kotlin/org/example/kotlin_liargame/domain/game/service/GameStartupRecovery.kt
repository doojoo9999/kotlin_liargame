package org.example.kotlin_liargame.domain.game.service

import org.slf4j.LoggerFactory
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

@Component
class GameStartupRecovery(
    private val gameCleanupService: GameCleanupService,
    private val turnTimeoutService: TurnTimeoutService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    @EventListener(ApplicationReadyEvent::class)
    fun onApplicationReady() {
        logger.info("[GameStartupRecovery] Running startup recovery tasks")

        runCatching {
            val orphaned = gameCleanupService.cleanupOrphanedGames()
            val offline = gameCleanupService.cleanupOfflineOnlyGames()
            logger.info("[GameStartupRecovery] Cleaned orphaned={}, offlineOnly={}", orphaned, offline)
        }.onFailure { ex ->
            logger.error("[GameStartupRecovery] Cleanup task failed: {}", ex.message, ex)
        }

        runCatching {
            turnTimeoutService.checkTurnTimeouts()
        }.onFailure { ex ->
            logger.error("[GameStartupRecovery] Turn timeout sweep failed: {}", ex.message, ex)
        }
    }
}
