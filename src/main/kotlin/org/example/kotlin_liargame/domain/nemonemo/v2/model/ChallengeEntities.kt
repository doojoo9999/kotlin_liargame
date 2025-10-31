package org.example.kotlin_liargame.domain.nemonemo.v2.model

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.io.Serializable
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "achievements")
class AchievementEntity(
    @Column(nullable = false, unique = true, length = 64)
    val code: String,

    @Column(nullable = false, length = 120)
    val title: String,

    @Column(columnDefinition = "TEXT", nullable = false)
    val description: String,

    @Column(name = "icon_url")
    val iconUrl: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    val tier: AchievementTier,

    @Column(nullable = false)
    val points: Int,

    @Column(name = "conditions", columnDefinition = "jsonb", nullable = false)
    val conditions: String
) {
    @jakarta.persistence.Id
    @Column(columnDefinition = "uuid")
    val id: UUID = UUID.randomUUID()
}

@Embeddable
data class UserAchievementId(
    @Column(name = "subject_key", columnDefinition = "uuid")
    val subjectKey: UUID,

    @Column(name = "achievement_id", columnDefinition = "uuid")
    val achievementId: UUID
) : Serializable

@Entity
@Table(name = "user_achievements")
class UserAchievementEntity(
    @EmbeddedId
    val id: UserAchievementId,

    @Column(name = "unlocked_at", nullable = false)
    val unlockedAt: Instant = Instant.now(),

    @Column(name = "progress", columnDefinition = "jsonb")
    val progress: String? = null
)

@Entity
@Table(name = "challenges")
class ChallengeEntity(
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    val type: ChallengeType,

    @Column(nullable = false, length = 120)
    val title: String,

    @Column(columnDefinition = "TEXT")
    val description: String? = null,

    @Column(name = "requirements", columnDefinition = "jsonb", nullable = false)
    val requirements: String,

    @Column(name = "rewards", columnDefinition = "jsonb", nullable = false)
    val rewards: String,

    @Column(name = "start_date", nullable = false)
    val startDate: LocalDate,

    @Column(name = "end_date", nullable = false)
    val endDate: LocalDate,

    @Column(nullable = false)
    val active: Boolean = false
) {
    @jakarta.persistence.Id
    @Column(columnDefinition = "uuid")
    val id: UUID = UUID.randomUUID()
}

@Embeddable
data class UserChallengeId(
    @Column(name = "subject_key", columnDefinition = "uuid")
    val subjectKey: UUID,

    @Column(name = "challenge_id", columnDefinition = "uuid")
    val challengeId: UUID
) : Serializable

@Entity
@Table(name = "user_challenges")
class UserChallengeEntity(
    @EmbeddedId
    val id: UserChallengeId,

    @Column(name = "progress", columnDefinition = "jsonb", nullable = false)
    var progress: String,

    @Column(nullable = false)
    var completed: Boolean = false,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(nullable = false)
    var claimed: Boolean = false
)

@Entity
@Table(name = "season_passes")
class SeasonPassEntity(
    @Column(name = "season_number", nullable = false, unique = true)
    val seasonNumber: Int,

    @Column(nullable = false, length = 120)
    val title: String,

    @Column(name = "start_date", nullable = false)
    val startDate: LocalDate,

    @Column(name = "end_date", nullable = false)
    val endDate: LocalDate,

    @Column(name = "tiers", columnDefinition = "jsonb", nullable = false)
    val tiers: String,

    @Column(nullable = false)
    val active: Boolean = false
) {
    @jakarta.persistence.Id
    @Column(columnDefinition = "uuid")
    val id: UUID = UUID.randomUUID()
}

@Embeddable
data class UserSeasonProgressId(
    @Column(name = "subject_key", columnDefinition = "uuid")
    val subjectKey: UUID,

    @Column(name = "season_id", columnDefinition = "uuid")
    val seasonId: UUID
) : Serializable

@Entity
@Table(name = "user_season_progress")
class UserSeasonProgressEntity(
    @EmbeddedId
    val id: UserSeasonProgressId,

    @Column(name = "tier_level", nullable = false)
    var tierLevel: Int = 0,

    @Column(nullable = false)
    var xp: Long = 0,

    @Column(name = "last_claimed_tier")
    var lastClaimedTier: Int? = null,

    @Column(nullable = false)
    var premium: Boolean = false,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
