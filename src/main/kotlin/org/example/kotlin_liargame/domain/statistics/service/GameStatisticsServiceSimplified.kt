package org.example.kotlin_liargame.domain.statistics.service

import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.domain.word.repository.WordRepository
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Primary
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Primary
@Transactional(readOnly = true)
class GameStatisticsServiceSimplified(
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
        val lastPlayedAt: java.time.LocalDateTime?,
        val rank: Long,
        val achievements: List<Achievement>
    )

    data class Achievement(
        val id: String,
        val name: String,
        val description: String,
        val unlockedAt: java.time.LocalDateTime
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

    fun getGlobalStatistics(): GlobalStatistics {
        logger.debug("Generating simplified global game statistics")
        
        val totalGames = gameRepository.count()
        val activeGames = gameRepository.countByGameState(GameState.IN_PROGRESS)
        val completedGamesCount = gameRepository.countByGameState(GameState.ENDED)
        val totalPlayers = playerRepository.count()
        val totalUsers = userRepository.count()

        return GlobalStatistics(
            totalGames = totalGames,
            activeGames = activeGames,
            completedGames = completedGamesCount,
            totalPlayers = totalPlayers,
            onlinePlayers = 0L, // Simplified
            totalUsers = totalUsers,
            averageGameDuration = 30.0, // Default
            averagePlayersPerGame = if (totalGames > 0) totalPlayers.toDouble() / totalGames else 0.0,
            popularSubjects = emptyList(), // Simplified
            gameCompletionRate = if (totalGames > 0) (completedGamesCount.toDouble() / totalGames) * 100 else 0.0,
            peakConcurrentGames = 0L, // Simplified
            totalGameTime = 0L, // Simplified
            dailyActiveUsers = 0L, // Simplified
            weeklyActiveUsers = 0L, // Simplified
            monthlyActiveUsers = 0L // Simplified
        )
    }

    fun getPlayerStatistics(userId: Long): PlayerStatistics {
        logger.debug("Generating simplified player statistics for user: {}", userId)
        
        val user = userRepository.findById(userId).orElseThrow {
            IllegalArgumentException("User not found: $userId")
        }

        val gamesPlayed = playerRepository.getPlayerGamesCount(userId)
        val liarStats = playerRepository.getLiarStatistics(userId)

        return PlayerStatistics(
            userId = userId,
            nickname = user.nickname,
            gamesPlayed = gamesPlayed,
            gamesWon = 0L,
            winRate = 0.0,
            averageScore = 0.0,
            totalScore = 0L,
            timesAsLiar = liarStats.timesAsLiar,
            timesDetectedAsLiar = liarStats.timesDetected,
            liarSuccessRate = if (liarStats.timesAsLiar > 0) {
                ((liarStats.timesAsLiar - liarStats.timesDetected).toDouble() / liarStats.timesAsLiar) * 100
            } else 0.0,
            totalPlayTime = 0L,
            averageGameDuration = 0.0,
            favoriteSubjects = emptyList(),
            lastPlayedAt = null,
            rank = 1L,
            achievements = emptyList()
        )
    }

    fun getGameTrends(days: Int = 30): GameTrends {
        logger.debug("Generating simplified game trends for last {} days", days)
        
        return GameTrends(
            dailyGames = emptyList(),
            hourlyDistribution = emptyMap(),
            dayOfWeekDistribution = emptyMap(),
            playerGrowth = emptyList(),
            averageSessionLength = 30.0,
            retentionRates = RetentionRates(0.0, 0.0, 0.0)
        )
    }

    fun getLeaderboard(limit: Int = 100): List<PlayerStatistics> {
        logger.debug("Generating simplified leaderboard with limit: {}", limit)
        return emptyList()
    }
}