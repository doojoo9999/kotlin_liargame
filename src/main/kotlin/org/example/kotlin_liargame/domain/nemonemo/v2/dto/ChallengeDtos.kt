package org.example.kotlin_liargame.domain.nemonemo.v2.dto

import org.example.kotlin_liargame.domain.nemonemo.v2.model.AchievementTier
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ChallengeType
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class AchievementSummaryDto(
    val id: UUID,
    val code: String,
    val title: String,
    val description: String,
    val iconUrl: String?,
    val tier: AchievementTier,
    val points: Int,
    val unlockedAt: Instant?,
    val progress: Map<String, Any>?
)

data class ChallengeSummaryDto(
    val id: UUID,
    val type: ChallengeType,
    val title: String,
    val description: String?,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val requirements: Map<String, Any>,
    val rewards: Map<String, Any>,
    val progress: Map<String, Any>,
    val completed: Boolean,
    val claimed: Boolean
)

data class SeasonProgressDto(
    val seasonId: UUID,
    val seasonNumber: Int,
    val title: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val tierLevel: Int,
    val xp: Long,
    val lastClaimedTier: Int?,
    val premium: Boolean,
    val updatedAt: Instant
)
