package org.example.kotlin_liargame.domain.statistics.repository

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

data class HourlyDistribution(
    val hour: Int,
    val count: Long
)

data class DayOfWeekDistribution(
    val dayOfWeek: String,
    val count: Long
)