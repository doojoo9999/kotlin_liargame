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
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

interface PlayRepository : JpaRepository<PlayEntity, UUID> {
    fun findTop20ByPuzzleIdOrderByFinishedAtAsc(puzzleId: UUID): List<PlayEntity>
}

interface ScoreRepository : JpaRepository<ScoreEntity, ScoreId> {
    fun findTop100ByIdPuzzleIdOrderByBestScoreDesc(puzzleId: UUID): List<ScoreEntity>
    fun findTop100ByIdPuzzleIdAndIdModeOrderByBestTimeMsAsc(puzzleId: UUID, mode: org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode): List<ScoreEntity>
    fun findByIdSubjectKey(subjectKey: UUID, pageable: Pageable): List<ScoreEntity>
}

interface DailyPickRepository : JpaRepository<DailyPickEntity, LocalDate>

interface NotificationRepository : JpaRepository<NotificationEntity, UUID> {
    fun findByRecipientKeyOrderByCreatedAtDesc(recipientKey: UUID, pageable: Pageable): List<NotificationEntity>
}

interface GameSettingRepository : JpaRepository<GameSettingEntity, UUID>

interface FollowRepository : JpaRepository<FollowEntity, Long> {
    fun findAllByFollowerKey(followerKey: UUID): List<FollowEntity>
    fun countByFolloweeKey(followeeKey: UUID): Long
    fun existsByFollowerKeyAndFolloweeKey(followerKey: UUID, followeeKey: UUID): Boolean
}
