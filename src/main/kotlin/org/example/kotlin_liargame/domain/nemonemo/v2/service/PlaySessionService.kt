package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleValidationService
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayAutosaveRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayDetailResponse
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayResultDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayStartRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayStartResponse
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlaySubmitRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.service.LeaderboardCacheService.LeaderboardRecord
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PlayEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreId
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PlayRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleSolutionRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.ScoreRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Duration
import java.time.Instant
import java.time.ZoneOffset
import java.util.Base64
import java.util.UUID

@Service
class PlaySessionService(
    private val puzzleRepository: PuzzleRepository,
    private val playRepository: PlayRepository,
    private val scoreRepository: ScoreRepository,
    private val puzzleSolutionRepository: PuzzleSolutionRepository,
    private val puzzleValidationService: PuzzleValidationService,
    private val scoringService: ScoringService,
    private val leaderboardCacheService: LeaderboardCacheService,
    private val objectMapper: ObjectMapper
) {

    @Transactional
    fun startPlay(puzzleId: UUID, subjectKey: UUID, request: PlayStartRequest): PlayStartResponse {
        val cleanupNow = Instant.now()
        val cutoff = cleanupNow.minus(STALE_SESSION_TTL)
        playRepository.finishStaleSessions(subjectKey, cutoff, cleanupNow)
        val puzzle = puzzleRepository.findById(puzzleId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "PUZZLE_NOT_FOUND")
        }
        if (puzzle.status !in setOf(PuzzleStatus.APPROVED, PuzzleStatus.OFFICIAL)) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "PUZZLE_NOT_PLAYABLE")
        }
        val existing = playRepository
            .findTopByPuzzleIdAndSubjectKeyAndFinishedAtIsNullOrderByStartedAtDesc(puzzleId, subjectKey)
        if (existing != null) {
            return PlayStartResponse(
                playId = existing.id,
                stateToken = generateStateToken(existing.id, existing.startedAt),
                expiresAt = existing.startedAt.plusSeconds(STALE_SESSION_TTL.seconds)
            )
        }
        val play = PlayEntity(
            puzzle = puzzle,
            subjectKey = subjectKey,
            mode = request.mode,
            startedAt = Instant.now(),
            inputEvents = "[]"
        )
        val saved = playRepository.save(play)
        return PlayStartResponse(
            playId = saved.id,
            stateToken = generateStateToken(saved.id, saved.startedAt),
            expiresAt = saved.startedAt.plusSeconds(STALE_SESSION_TTL.seconds)
        )
    }

    @Transactional
    fun autosave(playId: UUID, subjectKey: UUID, request: PlayAutosaveRequest) {
        val play = playRepository.findById(playId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "PLAY_NOT_FOUND")
        }
        if (play.subjectKey != subjectKey) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "PLAY_FORBIDDEN")
        }
        play.progressSnapshots = objectMapper.writeValueAsString(request.snapshot)
        play.mistakes = request.mistakes
        play.undoCount = request.undoCount
        play.usedHints = request.usedHints
        playRepository.save(play)
    }

    @Transactional
    fun submit(playId: UUID, subjectKey: UUID, request: PlaySubmitRequest): PlayResultDto {
        val play = playRepository.findById(playId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "PLAY_NOT_FOUND")
        }
        if (play.subjectKey != subjectKey) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "PLAY_FORBIDDEN")
        }
        if (play.finishedAt != null) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "PLAY_ALREADY_FINISHED")
        }

        val solutionEntity = puzzleSolutionRepository.findById(play.puzzle.id).orElseThrow {
            ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "PUZZLE_SOLUTION_MISSING")
        }
        val submitted = puzzleValidationService.parseSolutionPayload(request.solution)
        val expected = puzzleValidationService.decodeSolution(
            solutionEntity.gridData,
            play.puzzle.width,
            play.puzzle.height
        )
        if (!submitted.contentDeepEquals(expected)) {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "INCORRECT_SOLUTION")
        }

        play.finishedAt = Instant.now()
        play.mistakes = request.mistakes
        play.usedHints = request.usedHints
        play.undoCount = request.undoCount
        play.comboCount = request.comboCount
        playRepository.save(play)

        val difficultyWeight = play.puzzle.difficultyScore ?: 1.0
        val breakdown = scoringService.calculateScore(play, request, difficultyWeight)

        val scoreId = ScoreId(play.puzzle.id, subjectKey, play.mode)
        val score = scoreRepository.findById(scoreId).orElseGet { ScoreEntity(scoreId) }
        val improved = breakdown.finalScore > (score.bestScore ?: Int.MIN_VALUE)
        score.bestScore = maxOf(score.bestScore ?: 0, breakdown.finalScore)
        score.bestTimeMs = minOf(score.bestTimeMs ?: Long.MAX_VALUE, request.elapsedMs)
        score.perfectClear = score.perfectClear || breakdown.perfectBonus > 0
        score.lastPlayedAt = Instant.now()
        scoreRepository.save(score)

        val updated = puzzleRepository.incrementPlayStats(play.puzzle.id, request.mistakes == 0)
        if (updated == 0) {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "PLAY_STATS_UPDATE_FAILED")
        }

        val leaderboardRank = if (improved) {
            scoreRepository.findTop100ByIdPuzzleIdOrderByBestScoreDesc(play.puzzle.id)
                .sortedByDescending { it.bestScore ?: 0 }
                .indexOfFirst { it.id == scoreId }
                .takeIf { it >= 0 }?.plus(1)
        } else {
            null
        }
        val result = scoringService.buildResult(play, breakdown, leaderboardRank, request.elapsedMs)

        leaderboardCacheService.recordPlayResult(
            LeaderboardRecord(
                subjectKey = subjectKey,
                puzzleId = play.puzzle.id,
                authorKey = play.puzzle.authorId,
                mode = play.mode,
                finalScore = breakdown.finalScore,
                elapsedMs = request.elapsedMs,
                comboCount = request.comboCount,
                mistakes = request.mistakes,
                finishedAt = play.finishedAt!!
            )
        )

        return result
    }

    @Transactional(readOnly = true)
    fun getPlay(playId: UUID, subjectKey: UUID): PlayDetailResponse {
        val play = playRepository.findById(playId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "PLAY_NOT_FOUND")
        }
        if (play.subjectKey != subjectKey) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "PLAY_FORBIDDEN")
        }
        @Suppress("UNCHECKED_CAST")
        val snapshot = play.progressSnapshots?.let {
            objectMapper.readValue(it, Map::class.java) as Map<String, Any?>
        }
        return PlayDetailResponse(
            playId = play.id,
            puzzleId = play.puzzle.id,
            snapshot = snapshot,
            startedAt = play.startedAt,
            lastSavedAt = play.modifiedAt.atZone(ZoneOffset.UTC).toInstant(),
            stateToken = generateStateToken(play.id, play.startedAt)
        )
    }

    private fun generateStateToken(playId: UUID, startedAt: Instant): String =
        Base64.getUrlEncoder().encodeToString("$playId:${startedAt.toEpochMilli()}".toByteArray())

    companion object {
        private val STALE_SESSION_TTL: Duration = Duration.ofHours(1)
    }
}
