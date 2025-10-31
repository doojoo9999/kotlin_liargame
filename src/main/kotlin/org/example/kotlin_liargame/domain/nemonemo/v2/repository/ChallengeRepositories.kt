package org.example.kotlin_liargame.domain.nemonemo.v2.repository

import org.example.kotlin_liargame.domain.nemonemo.v2.model.AchievementEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ChallengeEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ChallengeType
import org.example.kotlin_liargame.domain.nemonemo.v2.model.SeasonPassEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.UserAchievementEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.UserAchievementId
import org.example.kotlin_liargame.domain.nemonemo.v2.model.UserChallengeEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.UserChallengeId
import org.example.kotlin_liargame.domain.nemonemo.v2.model.UserSeasonProgressEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.UserSeasonProgressId
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate
import java.util.UUID

interface AchievementRepository : JpaRepository<AchievementEntity, UUID>

interface UserAchievementRepository : JpaRepository<UserAchievementEntity, UserAchievementId> {
    fun findAllByIdSubjectKey(subjectKey: UUID): List<UserAchievementEntity>
}

interface ChallengeRepository : JpaRepository<ChallengeEntity, UUID> {
    fun findAllByTypeAndActiveIsTrue(type: ChallengeType): List<ChallengeEntity>
    fun findAllByStartDateLessThanEqualAndEndDateGreaterThanEqual(date: LocalDate, date2: LocalDate): List<ChallengeEntity>
}

interface UserChallengeRepository : JpaRepository<UserChallengeEntity, UserChallengeId> {
    fun findAllByIdSubjectKey(subjectKey: UUID): List<UserChallengeEntity>
}

interface SeasonPassRepository : JpaRepository<SeasonPassEntity, UUID> {
    fun findFirstByActiveIsTrueOrderBySeasonNumberDesc(): SeasonPassEntity?
}

interface UserSeasonProgressRepository : JpaRepository<UserSeasonProgressEntity, UserSeasonProgressId> {
    fun findByIdSubjectKeyAndIdSeasonId(subjectKey: UUID, seasonId: UUID): UserSeasonProgressEntity?
}
