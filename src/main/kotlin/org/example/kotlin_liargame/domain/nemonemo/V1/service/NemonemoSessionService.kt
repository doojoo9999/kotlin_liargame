package org.example.kotlin_liargame.domain.nemonemo.V1.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.example.kotlin_liargame.domain.nemonemo.dto.SessionActionRequestDto
import org.example.kotlin_liargame.domain.nemonemo.dto.SessionCompletionRequestDto
import org.example.kotlin_liargame.domain.nemonemo.dto.SessionCompletionResponseDto
import org.example.kotlin_liargame.domain.nemonemo.dto.SessionResponseDto
import org.example.kotlin_liargame.domain.nemonemo.dto.SessionStartRequestDto
import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoLeaderboardEntryEntity
import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoSessionEntity
import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoSessionSnapshotEntity
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleSessionStatus
import org.example.kotlin_liargame.domain.nemonemo.repository.NemonemoLeaderboardEntryRepository
import org.example.kotlin_liargame.domain.nemonemo.repository.NemonemoPuzzleReleaseRepository
import org.example.kotlin_liargame.domain.nemonemo.repository.NemonemoPuzzleRepository
import org.example.kotlin_liargame.domain.nemonemo.repository.NemonemoSessionRepository
import org.example.kotlin_liargame.domain.nemonemo.repository.NemonemoSessionSnapshotRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class NemonemoSessionService(
    private val puzzleRepository: NemonemoPuzzleRepository,
    private val puzzleReleaseRepository: NemonemoPuzzleReleaseRepository,
    private val sessionRepository: NemonemoSessionRepository,
    private val sessionSnapshotRepository: NemonemoSessionSnapshotRepository,
    private val leaderboardEntryRepository: NemonemoLeaderboardEntryRepository,
    private val objectMapper: ObjectMapper
) {

    @Transactional
    fun startSession(userId: Long, request: SessionStartRequestDto): SessionResponseDto {
        val puzzle = puzzleRepository.findByIdOrNull(request.puzzleId)
            ?: throw NemonemoResourceNotFoundException("Puzzle ${request.puzzleId} not found")

        if (request.resume) {
            val existing = sessionRepository.findFirstByUserIdAndPuzzle_IdAndStatusOrderByCreatedAtDesc(
                userId = userId,
                puzzleId = puzzle.id,
                status = PuzzleSessionStatus.IN_PROGRESS
            )
            if (existing != null) {
                return SessionResponseDto.from(existing)
            }
        }

        val release = puzzleReleaseRepository.findFirstByPuzzleIdOrderByReleaseAtDesc(puzzle.id)
        val session = sessionRepository.save(
            NemonemoSessionEntity(
                userId = userId,
                puzzle = puzzle,
                release = release
            )
        )
        return SessionResponseDto.from(session)
    }

    @Transactional
    fun applyActions(sessionId: Long, request: SessionActionRequestDto) {
        val session = sessionRepository.findByIdOrNull(sessionId)
            ?: throw NemonemoResourceNotFoundException("Session $sessionId not found")

        request.mistakeCount?.let { session.mistakeCount = it }
        request.hintsUsed?.let { session.hintUsed = it }
        request.durationSeconds?.let { session.durationSeconds = it }

        val snapshotPayload = objectMapper.writeValueAsString(request)
        sessionSnapshotRepository.save(
            NemonemoSessionSnapshotEntity(
                session = session,
                cellStates = snapshotPayload,
                capturedAt = LocalDateTime.now()
            )
        )
    }

    @Transactional
    fun completeSession(userId: Long, sessionId: Long, request: SessionCompletionRequestDto): SessionCompletionResponseDto {
        val session = sessionRepository.findByIdOrNull(sessionId)
            ?: throw NemonemoResourceNotFoundException("Session $sessionId not found")

        if (session.userId != userId) {
            throw NemonemoUnauthorizedException("Session $sessionId does not belong to user $userId")
        }

        session.status = PuzzleSessionStatus.COMPLETED
        session.completedAt = LocalDateTime.now()
        session.finalScore = request.finalScore
        session.durationSeconds = request.durationSeconds
        session.mistakeCount = request.mistakes
        session.hintUsed = request.hintsUsed

        val pointsAwarded = calculatePointsAwarded(request.finalScore, request.mistakes, request.hintsUsed)
        val rankEstimate = updateLeaderboard(session, request)

        return SessionCompletionResponseDto(
            sessionId = session.id,
            score = request.finalScore,
            pointsAwarded = pointsAwarded,
            rankEstimate = rankEstimate,
            completionTimeSeconds = request.durationSeconds
        )
    }

    private fun calculatePointsAwarded(score: Int, mistakes: Int, hintsUsed: Int): Int {
        val penalty = (mistakes * 5) + (hintsUsed * 3)
        return (score - penalty).coerceAtLeast(0)
    }

    private fun updateLeaderboard(
        session: NemonemoSessionEntity,
        request: SessionCompletionRequestDto
    ): Int? {
        val release = session.release ?: return null

        val existingEntry = leaderboardEntryRepository
            .findFirstByReleaseAndUserIdOrderByScoreDesc(release, session.userId)

        val calculatedAccuracy = request.accuracy ?: calculateAccuracy(request)

        val entry = existingEntry?.apply {
            if (request.finalScore > score) {
                score = request.finalScore
                durationSeconds = request.durationSeconds
                accuracy = calculatedAccuracy
            }
        } ?: NemonemoLeaderboardEntryEntity(
            release = release,
            userId = session.userId,
            rank = existingEntry?.rank ?: 1,
            score = request.finalScore,
            durationSeconds = request.durationSeconds,
            accuracy = calculatedAccuracy
        )

        leaderboardEntryRepository.save(entry)
        return entry.rank
    }

    private fun calculateAccuracy(request: SessionCompletionRequestDto): Double {
        val base = 100.0
        val penalty = (request.mistakes * 2) + (request.hintsUsed)
        return (base - penalty).coerceAtLeast(0.0)
    }

    @Transactional(readOnly = true)
    fun getSession(sessionId: Long): SessionResponseDto {
        val session = sessionRepository.findByIdOrNull(sessionId)
            ?: throw NemonemoResourceNotFoundException("Session $sessionId not found")
        return SessionResponseDto.from(session)
    }
}

class NemonemoResourceNotFoundException(message: String) : RuntimeException(message)
class NemonemoUnauthorizedException(message: String) : RuntimeException(message)
