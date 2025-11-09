package org.example.kotlin_liargame.domain.nemonemo.v2.repository

import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleAuditLogEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleCommentEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleHintEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleRatingEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleSeriesEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleSolutionEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleVoteEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface PuzzleRepository : JpaRepository<PuzzleEntity, UUID> {
    fun findByStatusOrderByCreatedAtDesc(status: PuzzleStatus): List<PuzzleEntity>
    fun findByOfficialAtAfter(threshold: Instant): List<PuzzleEntity>

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional(propagation = Propagation.MANDATORY)
    @Query(
        "update PuzzleEntity p set p.playCount = p.playCount + 1, " +
            "p.clearCount = p.clearCount + CASE WHEN :clear THEN 1 ELSE 0 END, " +
            "p.modifiedAt = CURRENT_TIMESTAMP where p.id = :id"
    )
    fun incrementPlayStats(id: UUID, clear: Boolean): Int
}

interface PuzzleSeriesRepository : JpaRepository<PuzzleSeriesEntity, UUID>

interface PuzzleHintRepository : JpaRepository<PuzzleHintEntity, UUID>

interface PuzzleSolutionRepository : JpaRepository<PuzzleSolutionEntity, UUID> {
    fun existsByChecksum(checksum: String): Boolean
}

interface PuzzleAuditLogRepository : JpaRepository<PuzzleAuditLogEntity, UUID> {
    fun findByPuzzleIdOrderByCreatedAtAsc(puzzleId: UUID): List<PuzzleAuditLogEntity>
}

interface PuzzleVoteRepository : JpaRepository<PuzzleVoteEntity, Long> {
    fun findByPuzzleIdAndSubjectKey(puzzleId: UUID, subjectKey: UUID): Optional<PuzzleVoteEntity>
}

interface PuzzleCommentRepository : JpaRepository<PuzzleCommentEntity, UUID> {
    fun findAllByPuzzleIdOrderByCreatedAtAsc(puzzleId: UUID): List<PuzzleCommentEntity>
}

interface PuzzleRatingRepository : JpaRepository<PuzzleRatingEntity, Long> {
    fun findByPuzzleIdAndRaterKey(puzzleId: UUID, raterKey: UUID): Optional<PuzzleRatingEntity>
}
