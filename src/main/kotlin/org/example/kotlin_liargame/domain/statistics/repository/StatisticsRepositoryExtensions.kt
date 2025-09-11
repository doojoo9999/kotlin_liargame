package org.example.kotlin_liargame.domain.statistics.repository

import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.time.LocalDate

// Extension data classes for statistics
data class GameDurationInfo(
    val gameId: Long,
    val durationInMinutes: Long
)

data class SubjectPopularityInfo(
    val subjectName: String,
    val timesUsed: Long,
    val averageRating: Double?,
    val category: String?
)

data class PlayerStatsInfo(
    val gamesPlayed: Long,
    val gamesWon: Long,
    val totalScore: Long,
    val totalPlayTime: Long,
    val averageGameDuration: Double,
    val firstGameAt: Instant?,
    val lastPlayedAt: Instant?
)

data class LiarStatsInfo(
    val timesAsLiar: Long,
    val timesDetected: Long
)

data class DailyGameStatInfo(
    val date: LocalDate,
    val totalGames: Long,
    val uniquePlayers: Long,
    val averageDuration: Double
)

data class PlayerGrowthStatInfo(
    val date: LocalDate,
    val newUsers: Long,
    val activeUsers: Long,
    val returningUsers: Long
)

// Repository interface extensions
@Repository
interface GameStatisticsRepository {
    
    @Query("""
        SELECT new org.example.kotlin_liargame.domain.statistics.repository.GameDurationInfo(
            g.id, 
            EXTRACT(EPOCH FROM (g.lastUpdated - g.createdAt)) / 60
        )
        FROM GameEntity g 
        WHERE g.gameState = 'ENDED' 
        AND g.lastUpdated IS NOT NULL
        ORDER BY g.createdAt DESC
    """)
    fun findCompletedGamesWithDuration(): List<GameDurationInfo>
    
    @Query("""
        SELECT new org.example.kotlin_liargame.domain.statistics.repository.SubjectPopularityInfo(
            s.title,
            COUNT(gs.id),
            AVG(CAST(gs.difficulty AS double)),
            s.category
        )
        FROM SubjectEntity s 
        JOIN GameSubjectEntity gs ON s.id = gs.subjectId
        GROUP BY s.id, s.title, s.category
        ORDER BY COUNT(gs.id) DESC
    """)
    fun getPopularSubjects(@Param("limit") limit: Int): List<SubjectPopularityInfo>
    
    @Query("""
        SELECT COUNT(DISTINCT g.id)
        FROM GameEntity g
        WHERE g.gameState = 'IN_PROGRESS'
        AND g.createdAt >= :since
    """)
    fun getPeakConcurrentGames(@Param("since") since: Instant = Instant.now().minusSeconds(86400)): Long
    
    @Query("""
        SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (g.lastUpdated - g.createdAt)) / 60), 0)
        FROM GameEntity g 
        WHERE g.gameState = 'ENDED' 
        AND g.lastUpdated IS NOT NULL
    """)
    fun getTotalGameTimeInMinutes(): Long
    
    @Query("""
        SELECT new org.example.kotlin_liargame.domain.statistics.repository.DailyGameStatInfo(
            CAST(g.createdAt AS LocalDate),
            COUNT(g.id),
            COUNT(DISTINCT p.userId),
            AVG(EXTRACT(EPOCH FROM (g.lastUpdated - g.createdAt)) / 60)
        )
        FROM GameEntity g
        LEFT JOIN PlayerEntity p ON g.id = p.gameId
        WHERE CAST(g.createdAt AS LocalDate) BETWEEN :startDate AND :endDate
        GROUP BY CAST(g.createdAt AS LocalDate)
        ORDER BY CAST(g.createdAt AS LocalDate)
    """)
    fun getDailyGameStats(
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): List<DailyGameStatInfo>
    
    @Query("""
        SELECT EXTRACT(HOUR FROM g.createdAt) as hour, COUNT(g.id) as count
        FROM GameEntity g 
        WHERE g.createdAt >= :since
        GROUP BY EXTRACT(HOUR FROM g.createdAt)
        ORDER BY hour
    """)
    fun getHourlyGameDistribution(@Param("since") since: Instant = Instant.now().minusDays(30)): Map<Int, Long>
    
    @Query("""
        SELECT 
            CASE EXTRACT(DOW FROM g.createdAt)
                WHEN 0 THEN 'Sunday'
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
            END as dayOfWeek,
            COUNT(g.id) as count
        FROM GameEntity g 
        WHERE g.createdAt >= :since
        GROUP BY EXTRACT(DOW FROM g.createdAt)
        ORDER BY EXTRACT(DOW FROM g.createdAt)
    """)
    fun getDayOfWeekDistribution(@Param("since") since: Instant = Instant.now().minusDays(30)): Map<String, Long>
    
    @Query("""
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (g.lastUpdated - g.createdAt)) / 60), 0)
        FROM GameEntity g 
        WHERE g.gameState = 'ENDED' 
        AND g.lastUpdated IS NOT NULL
        AND g.createdAt >= :since
    """)
    fun getAverageSessionLength(@Param("since") since: Instant = Instant.now().minusDays(30)): Double
}

@Repository
interface PlayerStatisticsRepository {
    
    @Query("""
        SELECT new org.example.kotlin_liargame.domain.statistics.repository.PlayerStatsInfo(
            COUNT(p.id),
            SUM(CASE WHEN p.isWinner = true THEN 1 ELSE 0 END),
            COALESCE(SUM(p.cumulativeScore), 0),
            COALESCE(SUM(p.playTimeMinutes), 0),
            COALESCE(AVG(p.playTimeMinutes), 0),
            MIN(p.createdAt),
            MAX(p.lastActiveAt)
        )
        FROM PlayerEntity p 
        WHERE p.userId = :userId
    """)
    fun getPlayerStatistics(@Param("userId") userId: Long): PlayerStatsInfo
    
    @Query("""
        SELECT new org.example.kotlin_liargame.domain.statistics.repository.LiarStatsInfo(
            SUM(CASE WHEN p.isLiar = true THEN 1 ELSE 0 END),
            SUM(CASE WHEN p.isLiar = true AND p.wasDetected = true THEN 1 ELSE 0 END)
        )
        FROM PlayerEntity p 
        WHERE p.userId = :userId
    """)
    fun getLiarStatistics(@Param("userId") userId: Long): LiarStatsInfo
    
    @Query("""
        SELECT s.title
        FROM PlayerEntity p
        JOIN GameEntity g ON p.gameId = g.id
        JOIN GameSubjectEntity gs ON g.id = gs.gameId
        JOIN SubjectEntity s ON gs.subjectId = s.id
        WHERE p.userId = :userId
        GROUP BY s.id, s.title
        ORDER BY COUNT(s.id) DESC
    """)
    fun getFavoriteSubjects(@Param("userId") userId: Long, @Param("limit") limit: Int): List<String>
    
    @Query("""
        SELECT COUNT(p2.userId) + 1
        FROM PlayerEntity p1, PlayerEntity p2
        WHERE p1.userId = :userId
        AND p2.cumulativeScore > p1.cumulativeScore
    """)
    fun getPlayerRank(@Param("userId") userId: Long): Long
    
    @Query("""
        SELECT p.userId
        FROM PlayerEntity p
        GROUP BY p.userId
        ORDER BY SUM(p.cumulativeScore) DESC
    """)
    fun getTopPlayersByScore(@Param("limit") limit: Int): List<Long>
    
    @Query("""
        SELECT COUNT(DISTINCT p.userId)
        FROM PlayerEntity p
        WHERE p.lastActiveAt >= :since
    """)
    fun countActivePlayersSince(@Param("since") since: Instant): Long
    
    @Query("""
        SELECT MAX(consecutive_wins)
        FROM (
            SELECT p.userId,
                   COUNT(*) as consecutive_wins
            FROM PlayerEntity p
            WHERE p.userId = :userId
              AND p.isWinner = true
            GROUP BY p.userId, 
                     p.createdAt - ROW_NUMBER() OVER (ORDER BY p.createdAt) * INTERVAL '1' DAY
        ) win_streaks
    """)
    fun getPlayerWinStreak(@Param("userId") userId: Long): Long
}

@Repository
interface UserStatisticsRepository {
    
    @Query("""
        SELECT COUNT(DISTINCT u.id)
        FROM UserEntity u
        WHERE u.lastLoginAt >= :since
    """)
    fun countActiveUsersSince(@Param("since") since: Instant): Long
    
    @Query("""
        SELECT new org.example.kotlin_liargame.domain.statistics.repository.PlayerGrowthStatInfo(
            CAST(u.createdAt AS LocalDate),
            COUNT(DISTINCT CASE WHEN CAST(u.createdAt AS LocalDate) = CAST(:date AS LocalDate) THEN u.id END),
            COUNT(DISTINCT CASE WHEN u.lastLoginAt >= :date THEN u.id END),
            COUNT(DISTINCT CASE WHEN u.lastLoginAt >= :date AND CAST(u.createdAt AS LocalDate) < CAST(:date AS LocalDate) THEN u.id END)
        )
        FROM UserEntity u 
        WHERE CAST(u.createdAt AS LocalDate) BETWEEN :startDate AND :endDate
        GROUP BY CAST(u.createdAt AS LocalDate)
        ORDER BY CAST(u.createdAt AS LocalDate)
    """)
    fun getPlayerGrowthStats(
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): List<PlayerGrowthStatInfo>
    
    @Query("""
        SELECT COUNT(u.id)
        FROM UserEntity u
        WHERE u.createdAt >= :thirtyDaysAgo
    """)
    fun countNewUsersInLast30Days(@Param("thirtyDaysAgo") thirtyDaysAgo: Instant = Instant.now().minusSeconds(30 * 24 * 60 * 60)): Long
    
    @Query("""
        SELECT COUNT(DISTINCT u.id)
        FROM UserEntity u
        WHERE u.createdAt <= :daysAgo
        AND u.lastLoginAt >= :daysAgo
    """)
    fun countReturnedUsersAfterDays(@Param("daysAgo") daysAgo: Int): Long
}