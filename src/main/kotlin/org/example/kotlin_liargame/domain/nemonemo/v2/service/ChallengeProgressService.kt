package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.AchievementSummaryDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.ChallengeSummaryDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.SeasonProgressDto
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ChallengeEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.AchievementRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.ChallengeRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.SeasonPassRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.UserAchievementRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.UserChallengeRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.UserSeasonProgressRepository
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Service
class ChallengeProgressService(
    private val achievementRepository: AchievementRepository,
    private val userAchievementRepository: UserAchievementRepository,
    private val challengeRepository: ChallengeRepository,
    private val userChallengeRepository: UserChallengeRepository,
    private val seasonPassRepository: SeasonPassRepository,
    private val userSeasonProgressRepository: UserSeasonProgressRepository,
    private val objectMapper: ObjectMapper
) {

    fun getAchievements(subjectKey: UUID): List<AchievementSummaryDto> {
        val unlocked = userAchievementRepository.findAllByIdSubjectKey(subjectKey)
            .associateBy({ it.id.achievementId }, { it })
        return achievementRepository.findAll().map { achievement ->
            val progressPayload = unlocked[achievement.id]?.progress
            AchievementSummaryDto(
                id = achievement.id,
                code = achievement.code,
                title = achievement.title,
                description = achievement.description,
                iconUrl = achievement.iconUrl,
                tier = achievement.tier,
                points = achievement.points,
                unlockedAt = unlocked[achievement.id]?.unlockedAt,
                progress = progressPayload?.let { parseMap(it) }
            )
        }
    }

    fun getChallenges(subjectKey: UUID): List<ChallengeSummaryDto> {
        val today = LocalDate.now()
        val active = challengeRepository.findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today)
        val userProgress = userChallengeRepository.findAllByIdSubjectKey(subjectKey)
            .associateBy({ it.id.challengeId }, { it })
        return active.map { challenge ->
            val userEntry = userProgress[challenge.id]
            ChallengeSummaryDto(
                id = challenge.id,
                type = challenge.type,
                title = challenge.title,
                description = challenge.description,
                startDate = challenge.startDate,
                endDate = challenge.endDate,
                requirements = parseMap(challenge.requirements),
                rewards = parseMap(challenge.rewards),
                progress = userEntry?.progress?.let { parseMap(it) } ?: emptyMap(),
                completed = userEntry?.completed ?: false,
                claimed = userEntry?.claimed ?: false
            )
        }
    }

    fun getSeasonProgress(subjectKey: UUID): SeasonProgressDto? {
        val season = seasonPassRepository.findFirstByActiveIsTrueOrderBySeasonNumberDesc() ?: return null
        val progress = userSeasonProgressRepository.findByIdSubjectKeyAndIdSeasonId(subjectKey, season.id)
        return SeasonProgressDto(
            seasonId = season.id,
            seasonNumber = season.seasonNumber,
            title = season.title,
            startDate = season.startDate,
            endDate = season.endDate,
            tierLevel = progress?.tierLevel ?: 0,
            xp = progress?.xp ?: 0,
            lastClaimedTier = progress?.lastClaimedTier,
            premium = progress?.premium ?: false,
            updatedAt = progress?.updatedAt ?: Instant.now()
        )
    }

    private fun parseMap(raw: String): Map<String, Any> =
        runCatching { objectMapper.readValue(raw, Map::class.java) as Map<String, Any> }.getOrElse { emptyMap() }
}
