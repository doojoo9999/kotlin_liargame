package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit

@Service
class GameCleanupService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    @Scheduled(cron = "0 0 4 * * *") // Run every day at 4 AM
    @Transactional
    fun cleanupStaleGames() {
        logger.info("Starting stale game cleanup task.")
        
        val twentyFourHoursAgo = Instant.now().minus(24, ChronoUnit.HOURS)
        val staleGames = gameRepository.findStaleWaitingGames(twentyFourHoursAgo)
        
        if (staleGames.isEmpty()) {
            logger.info("No stale games found to clean up.")
            return
        }

        logger.info("Found ${staleGames.size} stale games to clean up.")

        staleGames.forEach { game ->
            try {
                val players = playerRepository.findByGame(game)
                if (players.isNotEmpty()) {
                    playerRepository.deleteAll(players)
                }
                gameRepository.delete(game)
                logger.info("Successfully cleaned up stale game room: ${game.gameNumber}")
            } catch (e: Exception) {
                logger.error("Error cleaning up stale game room: ${game.gameNumber}", e)
            }
        }
        
        logger.info("Finished stale game cleanup task.")
    }
}
