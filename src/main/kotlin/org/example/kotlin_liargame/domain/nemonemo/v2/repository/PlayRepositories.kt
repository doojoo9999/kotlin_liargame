package org.example.kotlin_liargame.domain.nemonemo.v2.repository

import org.example.kotlin_liargame.domain.nemonemo.v2.model.DailyPickEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.FollowEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.GameSettingEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.NotificationEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PlayEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreId
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.data.repository.query.Param
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

interface PlayRepository : JpaRepository<PlayEntity, UUID> {
    fun findTop20ByPuzzleIdOrderByFinishedAtAsc(puzzleId: UUID): List<PlayEntity>
    fun findTopByPuzzleIdAndSubjectKeyAndFinishedAtIsNullOrderByStartedAtDesc(puzzleId: UUID, subjectKey: UUID): PlayEntity?

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional(propagation = Propagation.MANDATORY)
    @Query(
        "update PlayEntity p set p.finishedAt = :markTime, p.modifiedAt = CURRENT_TIMESTAMP " +
            "where p.subjectKey = :subjectKey and p.finishedAt is null and p.startedAt < :cutoff"
    )
    fun finishStaleSessions(
        @Param("subjectKey") subjectKey: UUID,
        @Param("cutoff") cutoff: Instant,
        @Param("markTime") markTime: Instant
    ): Int
}

interface ScoreRepository : JpaRepository<ScoreEntity, ScoreId> {
    fun findTop100ByIdPuzzleIdOrderByBestScoreDesc(puzzleId: UUID): List<ScoreEntity>
    fun findTop100ByIdPuzzleIdAndIdModeOrderByBestTimeMsAsc(puzzleId: UUID, mode: org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode): List<ScoreEntity>
    fun findByIdSubjectKey(subjectKey: UUID, pageable: Pageable): List<ScoreEntity>
}

interface DailyPickRepository : JpaRepository<DailyPickEntity, LocalDate> {
    fun findAllByPickDateBetween(start: LocalDate, end: LocalDate): List<DailyPickEntity>
}
 

interface NotificationRepository : JpaRepository<NotificationEntity, UUID> {
    fun findByRecipientKeyOrderByCreatedAtDesc(recipientKey: UUID, pageable: Pageable): List<NotificationEntity>
}

interface GameSettingRepository : JpaRepository<GameSettingEntity, UUID>

interface FollowRepository : JpaRepository<FollowEntity, Long> {
    fun findAllByFollowerKey(followerKey: UUID): List<FollowEntity>
    fun countByFolloweeKey(followeeKey: UUID): Long
    fun existsByFollowerKeyAndFolloweeKey(followerKey: UUID, followeeKey: UUID): Boolean
}
