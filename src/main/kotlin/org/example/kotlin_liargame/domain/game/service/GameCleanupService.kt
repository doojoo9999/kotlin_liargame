package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.chat.service.ChatService
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.GameSubjectRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant
import java.time.ZoneId

@Service
class GameCleanupService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val gameSubjectRepository: GameSubjectRepository,
    private val chatService: ChatService,
    private val gameMonitoringService: GameMonitoringService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    companion object {
        private val OFFLINE_CLEANUP_GRACE: Duration = Duration.ofMinutes(2)
        private val zoneId: ZoneId = ZoneId.systemDefault()
    }

    /**
     * Clean up orphaned games that are stuck in WAITING state with only one player
     * This handles the case where the owner is the only player and the game is stuck
     */
    @Transactional
    fun cleanupOrphanedGames(): Int {
        logger.info("Starting cleanup of orphaned games...")

        val waitingGames = gameRepository.findByGameState(GameState.WAITING)
        var cleanedCount = 0

        val threshold = Instant.now().minus(OFFLINE_CLEANUP_GRACE)

        for (game in waitingGames) {
            val players = playerRepository.findByGame(game)

            if (players.size != 1) {
                continue
            }

            val owner = players.first()
            val createdDeadline = game.createdAt.isBefore(java.time.LocalDateTime.now().minusMinutes(5))
            val recentlyActive = owner.isOnline || wasRecentlyActive(owner, game, threshold)

            if (!createdDeadline) {
                continue
            }

            if (recentlyActive) {
                logger.debug(
                    "Skipping orphaned cleanup for game {} because owner {} is still active (online={}, lastActive={})",
                    game.gameNumber,
                    owner.nickname,
                    owner.isOnline,
                    owner.lastActiveAt
                )
                continue
            }

            logger.info(
                "Found orphaned game eligible for cleanup: gameNumber={}, owner={}, created={}",
                game.gameNumber,
                game.gameOwner,
                game.createdAt
            )

            if (forceCleanupGame(game.gameNumber, reason = "ORPHANED_OWNER_INACTIVE")) {
                cleanedCount++
            }
        }

        logger.info("Cleanup completed. Cleaned $cleanedCount orphaned games.")
        return cleanedCount
    }


    @Transactional
    fun cleanupOfflineOnlyGames(): Int {
        val offlineGames = gameRepository.findActiveGamesWithAllPlayersOffline()
        if (offlineGames.isEmpty()) {
            logger.info("No games found where all players are offline.")
            return 0
        }

        val threshold = Instant.now().minus(OFFLINE_CLEANUP_GRACE)
        var cleanedCount = 0
        offlineGames.forEach { game ->
            try {
                val players = playerRepository.findByGame(game)
                val stillActive = players.any { wasRecentlyActive(it, game, threshold) }
                if (stillActive) {
                    logger.debug(
                        "Skipping offline cleanup for game {} because at least one player was active within grace period",
                        game.gameNumber
                    )
                    return@forEach
                }

                logger.warn(
                    "Cleaning up game {} (state={}) because all players are offline",
                    game.gameNumber,
                    game.gameState
                )

                if (forceCleanupGame(game.gameNumber, reason = "ALL_PLAYERS_OFFLINE")) {
                    cleanedCount++
                }
            } catch (e: Exception) {
                logger.error(
                    "Failed to clean up offline-only game {}: {}",
                    game.gameNumber,
                    e.message,
                    e
                )
            }
        }

        logger.info("Offline-only cleanup completed. Cleaned {} games.", cleanedCount)
        return cleanedCount
    }


    fun forceCleanupGame(gameNumber: Int, reason: String? = null): Boolean {
        val game = gameRepository.findByGameNumber(gameNumber)
        if (game == null) {
            logger.warn("Game $gameNumber not found for cleanup")
            return false
        }

        logger.warn("Force cleaning up game $gameNumber (state=${game.gameState})")

        try {
            // Delete in correct order
            chatService.deleteGameChatMessages(game)

            val players = playerRepository.findByGame(game)
            for (player in players) {
                chatService.deletePlayerChatMessages(player.userId)
            }
            playerRepository.deleteAll(players)

            val gameSubjects = gameSubjectRepository.findByGame(game)
            gameSubjectRepository.deleteAll(gameSubjects)

            gameRepository.delete(game)
            gameMonitoringService.notifyRoomDeleted(gameNumber, reason)
            logger.info("Successfully force cleaned up game $gameNumber")
            return true

        } catch (e: Exception) {
            logger.error("Failed to force clean up game $gameNumber: ${e.message}", e)
            return false
        }
    }

    @Scheduled(cron = "0 0 4 * * *") // Run every day at 4 AM
    @Transactional
    fun cleanupStaleGames() {
        logger.info("Starting stale game cleanup task.")

        val twentyFourHoursAgo = java.time.LocalDateTime.now().minusHours(24)
        val staleGames = gameRepository.findStaleWaitingGames(twentyFourHoursAgo)

        if (staleGames.isEmpty()) {
            logger.info("No stale games found to clean up.")
            return
        }

        logger.info("Found ${staleGames.size} stale games to clean up.")

        staleGames.forEach { game ->
            try {
                // Use the enhanced cleanup method
                forceCleanupGame(game.gameNumber)
            } catch (e: Exception) {
                logger.error("Error cleaning up stale game room: ${game.gameNumber}", e)
            }
        }

        logger.info("Finished stale game cleanup task.")
    }

    private fun wasRecentlyActive(player: PlayerEntity, game: GameEntity, threshold: Instant): Boolean {
        val lastActive = player.lastActiveAt
            ?: game.lastActivityAt
            ?: player.joinedAt

        return lastActive.isAfter(threshold)
    }

    @Scheduled(cron = "0 0 * * * *") // Run every hour
    fun scheduledOrphanedGameCleanup() {
        val orphanedCount = cleanupOrphanedGames()
        if (orphanedCount > 0) {
            logger.info("Scheduled cleanup removed $orphanedCount orphaned games")
        }

        val offlineCount = cleanupOfflineOnlyGames()
        if (offlineCount > 0) {
            logger.info("Scheduled cleanup removed $offlineCount offline-only games")
        }
    }
}
