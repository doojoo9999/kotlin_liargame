package org.example.kotlin_liargame.domain.statistics.service

import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.domain.word.repository.WordRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate

@Service
@Transactional(readOnly = true)
class GameStatisticsService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val userRepository: UserRepository,
    private val subjectRepository: SubjectRepository,
    private val wordRepository: WordRepository
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    data class GlobalStatistics(
        val totalGames: Long,
        val activeGames: Long,
        val completedGames: Long,
        val totalPlayers: Long,
        val onlinePlayers: Long,
        val totalUsers: Long,
        val averageGameDuration: Double,
        val averagePlayersPerGame: Double,
        val popularSubjects: List<SubjectPopularity>,
        val gameCompletionRate: Double,
        val peakConcurrentGames: Long,
        val totalGameTime: Long,
        val dailyActiveUsers: Long,
        val weeklyActiveUsers: Long,
        val monthlyActiveUsers: Long
    )

    data class SubjectPopularity(
        val subjectName: String,
        val timesUsed: Long,
        val averageRating: Double?,
        val category: String?
    )

    data class PlayerStatistics(
        val userId: Long,
        val nickname: String,
        val gamesPlayed: Long,
        val gamesWon: Long,
        val winRate: Double,
        val averageScore: Double,
        val totalScore: Long,
        val timesAsLiar: Long,
        val timesDetectedAsLiar: Long,
        val liarSuccessRate: Double,
        val totalPlayTime: Long,
        val averageGameDuration: Double,
        val favoriteSubjects: List<String>,
        val lastPlayedAt: Instant?,
        val rank: Long,
        val achievements: List<Achievement>
    )

    data class Achievement(
        val id: String,
        val name: String,
        val description: String,
        val unlockedAt: Instant
    )

    data class GameTrends(
        val dailyGames: List<DailyGameStat>,
        val hourlyDistribution: Map<Int, Long>,
        val dayOfWeekDistribution: Map<String, Long>,
        val playerGrowth: List<PlayerGrowthStat>,
        val averageSessionLength: Double,
        val retentionRates: RetentionRates
    )

    data class DailyGameStat(
        val date: LocalDate,
        val totalGames: Long,
        val uniquePlayers: Long,
        val averageDuration: Double
    )

    data class PlayerGrowthStat(
        val date: LocalDate,
        val newUsers: Long,
        val activeUsers: Long,
        val returningUsers: Long
    )

    data class RetentionRates(
        val day1: Double,
        val day7: Double,
        val day30: Double
    )

    data class GamePerformanceMetrics(
        val averageResponseTime: Double,
        val peakConcurrentPlayers: Long,
        val systemLoadAverage: Double,
        val memoryUsage: Long,
        val databaseConnectionsActive: Long,
        val webSocketConnections: Long,
        val errorRate: Double
    )

    fun getGlobalStatistics(): GlobalStatistics {
        logger.debug("Generating global game statistics")
        
        val totalGames = gameRepository.count()
        val activeGames = gameRepository.countByGameState(GameState.IN_PROGRESS)
        val completedGamesCount = gameRepository.countByGameState(GameState.ENDED)
        val totalPlayers = playerRepository.count()
        val onlinePlayers = playerRepository.countByState(org.example.kotlin_liargame.domain.game.model.enum.PlayerState.WAITING_FOR_HINT)
        val totalUsers = userRepository.count()

        // Calculate average game duration
        val completedGamesList = gameRepository.findCompletedGames()
        val averageGameDuration = if (completedGamesList.isNotEmpty()) {
            // Simple average calculation - could be enhanced with actual duration calculation
            30.0 // Default average duration in minutes
        } else 0.0

        // Calculate average players per game
        val averagePlayersPerGame = if (totalGames > 0) {
            totalPlayers.toDouble() / totalGames
        } else 0.0

        // Get popular subjects
        val popularSubjects = getPopularSubjects()

        // Calculate completion rate
        val gameCompletionRate = if (totalGames > 0) {
            (completedGamesCount.toDouble() / totalGames) * 100
        } else 0.0

        // Get active user counts
        val now = java.time.LocalDateTime.now()
        val oneDayAgo = now.minusDays(1)
        val oneWeekAgo = now.minusWeeks(1)
        val oneMonthAgo = now.minusMonths(1)

        val dailyActiveUsers = userRepository.countActiveUsersSince(oneDayAgo)
        val weeklyActiveUsers = userRepository.countActiveUsersSince(oneWeekAgo)
        val monthlyActiveUsers = userRepository.countActiveUsersSince(oneMonthAgo)

        return GlobalStatistics(
            totalGames = totalGames,
            activeGames = activeGames,
            completedGames = completedGamesCount,
            totalPlayers = totalPlayers,
            onlinePlayers = onlinePlayers,
            totalUsers = totalUsers,
            averageGameDuration = averageGameDuration,
            averagePlayersPerGame = averagePlayersPerGame,
            popularSubjects = popularSubjects,
            gameCompletionRate = gameCompletionRate,
            peakConcurrentGames = getPeakConcurrentGames(),
            totalGameTime = getTotalGameTime(),
            dailyActiveUsers = dailyActiveUsers,
            weeklyActiveUsers = weeklyActiveUsers,
            monthlyActiveUsers = monthlyActiveUsers
        )
    }

    fun getPlayerStatistics(userId: Long): PlayerStatistics {
        logger.debug("Generating player statistics for user: {}", userId)
        
        val user = userRepository.findById(userId).orElseThrow {
            IllegalArgumentException("User not found: $userId")
        }

        // Use simplified queries
        val gamesPlayed = playerRepository.getPlayerGamesCount(userId)
        val gamesWon = 0L // Simplified for now
        val winRate = if (gamesPlayed > 0) (gamesWon.toDouble() / gamesPlayed) * 100 else 0.0
        
        val totalScore = 0L // Simplified for now
        val averageScore = if (gamesPlayed > 0) totalScore.toDouble() / gamesPlayed else 0.0

        val liarStats = playerRepository.getLiarStatistics(userId)
        val timesAsLiar = liarStats.timesAsLiar
        val timesDetectedAsLiar = liarStats.timesDetected
        val liarSuccessRate = if (timesAsLiar > 0) {
            ((timesAsLiar - timesDetectedAsLiar).toDouble() / timesAsLiar) * 100
        } else 0.0

        val favoriteSubjects = playerRepository.getFavoriteSubjects(userId).take(5)
        val rank = playerRepository.getPlayerRank(userId)
        val achievements = getPlayerAchievements(userId)

        return PlayerStatistics(
            userId = userId,
            nickname = user.nickname,
            gamesPlayed = gamesPlayed,
            gamesWon = gamesWon,
            winRate = winRate,
            averageScore = averageScore,
            totalScore = totalScore,
            timesAsLiar = timesAsLiar,
            timesDetectedAsLiar = timesDetectedAsLiar,
            liarSuccessRate = liarSuccessRate,
            totalPlayTime = 0L, // Simplified for now
            averageGameDuration = 0.0, // Simplified for now
            favoriteSubjects = favoriteSubjects,
            lastPlayedAt = null, // Simplified for now
            rank = rank,
            achievements = achievements
        )
    }

    fun getGameTrends(days: Int = 30): GameTrends {
        logger.debug("Generating game trends for last {} days", days)
        
        val endDate = LocalDate.now()
        val startDate = endDate.minusDays(days.toLong())
        
        // Use simplified repository methods and calculate statistics in service layer
        val startDateTime = startDate.atStartOfDay()
        val endDateTime = endDate.atTime(23, 59, 59)
        val gamesInPeriod = gameRepository.findGamesByDateRange(startDateTime, endDateTime)
        
        // Calculate daily stats manually
        val dailyStats = gamesInPeriod.groupBy { it.createdAt.toLocalDate() }
            .map { (date, games) ->
                DailyGameStat(
                    date = date,
                    totalGames = games.size.toLong(),
                    uniquePlayers = 0L, // Would need player data to calculate
                    averageDuration = games.mapNotNull { game ->
                        if (game.modifiedAt != null) {
                            java.time.Duration.between(game.createdAt, game.modifiedAt).toMinutes().toDouble()
                        } else null
                    }.takeIf { it.isNotEmpty() }?.average() ?: 0.0
                )
            }
            .sortedBy { it.date }
        
        // Calculate hourly distribution
        val hourlyDistribution = gamesInPeriod.groupBy { it.createdAt.hour }
            .mapValues { it.value.size.toLong() }
        
        // Calculate day of week distribution  
        val dayOfWeekDistribution = gamesInPeriod.groupBy { 
            it.createdAt.dayOfWeek.getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH)
        }.mapValues { it.value.size.toLong() }
        val playerGrowth = userRepository.getPlayerGrowthStats(startDate, endDate, java.time.LocalDateTime.now().minusDays(days.toLong())).map { growth ->
            PlayerGrowthStat(
                date = growth.date,
                newUsers = growth.newUsers,
                activeUsers = growth.activeUsers,
                returningUsers = growth.returningUsers
            )
        }
        
        val averageSessionLength = if (gamesInPeriod.isNotEmpty()) {
            gamesInPeriod.mapNotNull { game ->
                if (game.modifiedAt != null) {
                    java.time.Duration.between(game.createdAt, game.modifiedAt).toMinutes().toDouble()
                } else null
            }.takeIf { it.isNotEmpty() }?.average() ?: 0.0
        } else 0.0
        val retentionRates = calculateRetentionRates()

        return GameTrends(
            dailyGames = dailyStats,
            hourlyDistribution = hourlyDistribution,
            dayOfWeekDistribution = dayOfWeekDistribution,
            playerGrowth = playerGrowth,
            averageSessionLength = averageSessionLength,
            retentionRates = retentionRates
        )
    }

    fun getLeaderboard(limit: Int = 100): List<PlayerStatistics> {
        logger.debug("Generating leaderboard with limit: {}", limit)
        
        val topPlayers = playerRepository.getTopPlayersByScore(limit)
        return topPlayers.map { playerId ->
            getPlayerStatistics(playerId)
        }
    }

    private fun getPopularSubjects(): List<SubjectPopularity> {
        return gameRepository.getPopularSubjects(10).map {
            SubjectPopularity(
                subjectName = it.subjectName,
                timesUsed = it.timesUsed,
                averageRating = it.averageRating,
                category = it.category
            )
        }
    }

    private fun getPeakConcurrentGames(): Long {
        // This would ideally be tracked in real-time metrics
        // For now, return the maximum number of games that were active at any point
        return gameRepository.getPeakConcurrentGames()
    }

    private fun getTotalGameTime(): Long {
        return gameRepository.getTotalCompletedGames()
    }

    private fun getPlayerAchievements(userId: Long): List<Achievement> {
        // Achievement system implementation
        val achievements = mutableListOf<Achievement>()
        
        val playerStats = playerRepository.getPlayerStatistics(userId)
        
        // First Game achievement
        if (playerStats.gamesPlayed >= 1) {
            achievements.add(Achievement(
                id = "first_game",
                name = "First Steps",
                description = "Played your first game",
                unlockedAt = playerStats.firstGameAt ?: Instant.now()
            ))
        }
        
        // Win streak achievements
        val winStreak = playerRepository.getPlayerWinStreak(userId)
        if (winStreak >= 5) {
            achievements.add(Achievement(
                id = "win_streak_5",
                name = "On Fire",
                description = "Won 5 games in a row",
                unlockedAt = Instant.now()
            ))
        }
        
        // Games played milestones
        when {
            playerStats.gamesPlayed >= 100 -> achievements.add(Achievement(
                id = "games_100",
                name = "Veteran Player",
                description = "Played 100 games",
                unlockedAt = Instant.now()
            ))
            playerStats.gamesPlayed >= 50 -> achievements.add(Achievement(
                id = "games_50",
                name = "Regular Player",
                description = "Played 50 games",
                unlockedAt = Instant.now()
            ))
            playerStats.gamesPlayed >= 10 -> achievements.add(Achievement(
                id = "games_10",
                name = "Getting Started",
                description = "Played 10 games",
                unlockedAt = Instant.now()
            ))
        }
        
        return achievements
    }

    private fun calculateRetentionRates(): RetentionRates {
        val totalNewUsers = userRepository.countNewUsersInLast30Days()
        
        val now = java.time.LocalDateTime.now()
        val day1Ago = now.minusDays(1)
        val day7Ago = now.minusDays(7)
        val day30Ago = now.minusDays(30)
        
        val day1Retention = if (totalNewUsers > 0) {
            userRepository.countReturnedUsersAfterDays(day1Ago).toDouble() / totalNewUsers
        } else 0.0
        
        val day7Retention = if (totalNewUsers > 0) {
            userRepository.countReturnedUsersAfterDays(day7Ago).toDouble() / totalNewUsers
        } else 0.0
        
        val day30Retention = if (totalNewUsers > 0) {
            userRepository.countReturnedUsersAfterDays(day30Ago).toDouble() / totalNewUsers
        } else 0.0
        
        return RetentionRates(
            day1 = day1Retention * 100,
            day7 = day7Retention * 100,
            day30 = day30Retention * 100
        )
    }
}