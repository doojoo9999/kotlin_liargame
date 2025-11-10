package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.mockk.Runs
import io.mockk.clearMocks
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleValidationService
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlaySubmitRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayStartRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayResultDto
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PlayEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleSolutionEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreId
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PlayRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleSolutionRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.ScoreRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.service.LeaderboardCacheService
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import java.time.Duration
import java.time.Instant
import java.util.Optional
import java.util.UUID

class PlaySessionServiceTest {

    private lateinit var puzzleRepository: PuzzleRepository
    private lateinit var playRepository: PlayRepository
    private lateinit var scoreRepository: ScoreRepository
    private lateinit var puzzleSolutionRepository: PuzzleSolutionRepository
    private lateinit var puzzleValidationService: PuzzleValidationService
    private lateinit var scoringService: ScoringService
    private lateinit var leaderboardCacheService: LeaderboardCacheService

    private lateinit var service: PlaySessionService

    private val objectMapper = jacksonObjectMapper()
    private val subjectKey: UUID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

    @BeforeEach
    fun setUp() {
        puzzleRepository = mockk()
        playRepository = mockk()
        scoreRepository = mockk()
        puzzleSolutionRepository = mockk()
        puzzleValidationService = mockk()
        scoringService = mockk()
        leaderboardCacheService = mockk()

        service = PlaySessionService(
            puzzleRepository = puzzleRepository,
            playRepository = playRepository,
            scoreRepository = scoreRepository,
            puzzleSolutionRepository = puzzleSolutionRepository,
            puzzleValidationService = puzzleValidationService,
            scoringService = scoringService,
            leaderboardCacheService = leaderboardCacheService,
            objectMapper = objectMapper
        )
        every {
            playRepository.findTopByPuzzleIdAndSubjectKeyAndFinishedAtIsNullOrderByStartedAtDesc(any(), any())
        } returns null
        every { playRepository.finishStaleSessions(any(), any(), any()) } returns 0
        every { leaderboardCacheService.recordPlayResult(any()) } just Runs
    }

    @AfterEach
    fun tearDown() {
        clearMocks(
            puzzleRepository,
            playRepository,
            scoreRepository,
            puzzleSolutionRepository,
            puzzleValidationService,
            scoringService,
            leaderboardCacheService
        )
    }

    @Test
    fun `startPlay returns session for approved puzzle`() {
        val puzzle = createPuzzle(PuzzleStatus.APPROVED)

        every { puzzleRepository.findById(puzzle.id) } returns Optional.of(puzzle)
        every {
            playRepository.findTopByPuzzleIdAndSubjectKeyAndFinishedAtIsNullOrderByStartedAtDesc(puzzle.id, subjectKey)
        } returns null
        val savedSlot = slot<PlayEntity>()
        every { playRepository.save(capture(savedSlot)) } answers { savedSlot.captured }

        val response = service.startPlay(puzzle.id, subjectKey, PlayStartRequest(PuzzleMode.NORMAL))

        assertEquals(savedSlot.captured.id, response.playId)
        assertEquals(savedSlot.captured.startedAt.plusSeconds(60 * 60), response.expiresAt)
        assertTrue(response.stateToken.isNotBlank())
        verify(exactly = 1) { playRepository.save(any()) }
    }

    @Test
    fun `startPlay expires stale sessions before new play`() {
        val puzzle = createPuzzle(PuzzleStatus.APPROVED)
        val cutoffSlot = slot<Instant>()
        val markSlot = slot<Instant>()
        every { puzzleRepository.findById(puzzle.id) } returns Optional.of(puzzle)
        every {
            playRepository.findTopByPuzzleIdAndSubjectKeyAndFinishedAtIsNullOrderByStartedAtDesc(puzzle.id, subjectKey)
        } returns null
        every { playRepository.save(any()) } answers { firstArg() }
        every {
            playRepository.finishStaleSessions(subjectKey, capture(cutoffSlot), capture(markSlot))
        } returns 2

        service.startPlay(puzzle.id, subjectKey, PlayStartRequest(PuzzleMode.NORMAL))

        assertEquals(Duration.ofHours(1), Duration.between(cutoffSlot.captured, markSlot.captured))
        verify(exactly = 1) { playRepository.finishStaleSessions(subjectKey, any(), any()) }
    }

    @Test
    fun `startPlay reuses existing unfinished session`() {
        val puzzle = createPuzzle(PuzzleStatus.APPROVED)
        val existing = PlayEntity(
            puzzle = puzzle,
            subjectKey = subjectKey,
            mode = PuzzleMode.NORMAL,
            startedAt = Instant.now().minusSeconds(30),
            inputEvents = "[]"
        )
        every { puzzleRepository.findById(puzzle.id) } returns Optional.of(puzzle)
        every {
            playRepository.findTopByPuzzleIdAndSubjectKeyAndFinishedAtIsNullOrderByStartedAtDesc(puzzle.id, subjectKey)
        } returns existing

        val response = service.startPlay(puzzle.id, subjectKey, PlayStartRequest(PuzzleMode.NORMAL))

        assertEquals(existing.id, response.playId)
        verify(exactly = 0) { playRepository.save(any()) }
    }

    @Test
    fun `submit persists score and increments stats`() {
        val puzzle = createPuzzle(PuzzleStatus.APPROVED).apply {
            difficultyScore = 4.0
        }
        val play = PlayEntity(
            puzzle = puzzle,
            subjectKey = subjectKey,
            mode = PuzzleMode.NORMAL,
            startedAt = Instant.now(),
            inputEvents = "[]"
        )

        val playId = play.id
        val request = PlaySubmitRequest(
            solution = listOf("#.", ".#"),
            elapsedMs = 120_000,
            mistakes = 0,
            usedHints = 0,
            undoCount = 1,
            comboCount = 3
        )
        val solutionEntity = PuzzleSolutionEntity(puzzleId = puzzle.id, gridData = byteArrayOf(1, 0), checksum = "checksum")
        val expectedGrid = arrayOf(booleanArrayOf(true, false), booleanArrayOf(false, true))
        val breakdown = ScoreBreakdown(
            finalScore = 2_100,
            timeBonus = 120,
            comboBonus = 6,
            perfectBonus = 500,
            penalty = 0
        )

        every { playRepository.findById(playId) } returns Optional.of(play)
        every { playRepository.save(any()) } answers { firstArg() }
        every { puzzleSolutionRepository.findById(puzzle.id) } returns Optional.of(solutionEntity)
        every { puzzleValidationService.parseSolutionPayload(request.solution) } returns expectedGrid
        every { puzzleValidationService.decodeSolution(solutionEntity.gridData, puzzle.width, puzzle.height) } returns expectedGrid
        every { scoringService.calculateScore(play, request, puzzle.difficultyScore ?: 1.0) } returns breakdown

        every {
            scoringService.buildResult(play, breakdown, any(), request.elapsedMs)
        } answers {
            val rank = arg<Int?>(2)
            PlayResultDto(
                puzzleId = puzzle.id,
                playId = playId,
                score = breakdown.finalScore,
                elapsedMs = request.elapsedMs,
                comboBonus = breakdown.comboBonus,
                perfectClear = breakdown.perfectBonus > 0,
                leaderboardRank = rank
            )
        }

        val scoreId = ScoreId(puzzle.id, subjectKey, PuzzleMode.NORMAL)
        every { scoreRepository.findById(scoreId) } returns Optional.empty()
        val savedScoreSlot = slot<ScoreEntity>()
        every { scoreRepository.save(capture(savedScoreSlot)) } answers { savedScoreSlot.captured }
        every { scoreRepository.findTop100ByIdPuzzleIdOrderByBestScoreDesc(puzzle.id) } answers { listOf(savedScoreSlot.captured) }
        every { puzzleRepository.incrementPlayStats(puzzle.id, true) } returns 1

        val result = service.submit(playId, subjectKey, request)

        assertEquals(breakdown.finalScore, result.score)
        assertEquals(1, result.leaderboardRank)
        assertTrue(result.perfectClear)
        assertNotNull(play.finishedAt)
        assertEquals(breakdown.finalScore, savedScoreSlot.captured.bestScore)
        assertEquals(request.elapsedMs, savedScoreSlot.captured.bestTimeMs)
        verify { puzzleRepository.incrementPlayStats(puzzle.id, true) }
        verify { scoreRepository.save(savedScoreSlot.captured) }
        verify { leaderboardCacheService.recordPlayResult(any()) }
    }

    @Test
    fun `submit fails when stat update fails`() {
        val puzzle = createPuzzle(PuzzleStatus.APPROVED)
        val play = PlayEntity(
            puzzle = puzzle,
            subjectKey = subjectKey,
            mode = PuzzleMode.NORMAL,
            startedAt = Instant.now(),
            inputEvents = "[]"
        )
        val playId = play.id
        val request = PlaySubmitRequest(
            solution = listOf("#."),
            elapsedMs = 10_000,
            mistakes = 0,
            usedHints = 0,
            undoCount = 0,
            comboCount = 0
        )
        val solutionEntity = PuzzleSolutionEntity(puzzleId = puzzle.id, gridData = byteArrayOf(1), checksum = "checksum")
        val solution = arrayOf(booleanArrayOf(true))
        val breakdown = ScoreBreakdown(
            finalScore = 1_500,
            timeBonus = 100,
            comboBonus = 10,
            perfectBonus = 500,
            penalty = 0
        )
        val scoreId = ScoreId(puzzle.id, subjectKey, PuzzleMode.NORMAL)
        val existingScore = ScoreEntity(scoreId).apply {
            bestScore = 2_000
            bestTimeMs = 5_000
            perfectClear = true
        }

        every { playRepository.findById(playId) } returns Optional.of(play)
        every { playRepository.save(any()) } answers { firstArg() }
        every { puzzleSolutionRepository.findById(puzzle.id) } returns Optional.of(solutionEntity)
        every { puzzleValidationService.parseSolutionPayload(request.solution) } returns solution
        every { puzzleValidationService.decodeSolution(solutionEntity.gridData, puzzle.width, puzzle.height) } returns solution
        every { scoringService.calculateScore(play, request, puzzle.difficultyScore ?: 1.0) } returns breakdown
        every { scoreRepository.findById(scoreId) } returns Optional.of(existingScore)
        every { scoreRepository.save(existingScore) } returns existingScore
        every { puzzleRepository.incrementPlayStats(puzzle.id, true) } returns 0

        val exception = org.junit.jupiter.api.assertThrows<ResponseStatusException> {
            service.submit(playId, subjectKey, request)
        }

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, exception.statusCode)
        verify(exactly = 0) { leaderboardCacheService.recordPlayResult(any()) }
    }

    @Test
    fun `submit rejects incorrect solution with 422`() {
        val puzzle = createPuzzle(PuzzleStatus.APPROVED)
        val play = PlayEntity(
            puzzle = puzzle,
            subjectKey = subjectKey,
            mode = PuzzleMode.NORMAL,
            startedAt = Instant.now(),
            inputEvents = "[]"
        )
        val playId = play.id
        val request = PlaySubmitRequest(
            solution = listOf("#."),
            elapsedMs = 10_000,
            mistakes = 0,
            usedHints = 0,
            undoCount = 0,
            comboCount = 0
        )
        val solutionEntity = PuzzleSolutionEntity(puzzleId = puzzle.id, gridData = byteArrayOf(1), checksum = "checksum")
        val submitted = arrayOf(booleanArrayOf(true))
        val expected = arrayOf(booleanArrayOf(false))

        every { playRepository.findById(playId) } returns Optional.of(play)
        every { puzzleSolutionRepository.findById(puzzle.id) } returns Optional.of(solutionEntity)
        every { puzzleValidationService.parseSolutionPayload(request.solution) } returns submitted
        every { puzzleValidationService.decodeSolution(solutionEntity.gridData, puzzle.width, puzzle.height) } returns expected

        val exception = org.junit.jupiter.api.assertThrows<ResponseStatusException> {
            service.submit(playId, subjectKey, request)
        }

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, exception.statusCode)
        verify(exactly = 0) { puzzleRepository.incrementPlayStats(any(), any()) }
        verify(exactly = 0) { leaderboardCacheService.recordPlayResult(any()) }
    }

    @Test
    fun `submit rejects already finished play`() {
        val puzzle = createPuzzle(PuzzleStatus.APPROVED)
        val finishedAt = Instant.now()
        val play = PlayEntity(
            puzzle = puzzle,
            subjectKey = subjectKey,
            mode = PuzzleMode.NORMAL,
            startedAt = finishedAt.minusSeconds(120),
            finishedAt = finishedAt,
            inputEvents = "[]"
        )
        val playId = play.id
        val request = PlaySubmitRequest(
            solution = listOf("#."),
            elapsedMs = 10_000,
            mistakes = 1,
            usedHints = 0,
            undoCount = 0,
            comboCount = 0
        )

        every { playRepository.findById(playId) } returns Optional.of(play)

        val exception = org.junit.jupiter.api.assertThrows<ResponseStatusException> {
            service.submit(playId, subjectKey, request)
        }

        assertEquals(HttpStatus.CONFLICT, exception.statusCode)
        verify(exactly = 0) { puzzleSolutionRepository.findById(any()) }
        verify(exactly = 0) { leaderboardCacheService.recordPlayResult(any()) }
    }

    @Test
    fun `submit returns cached result when idempotency key matches`() {
        val puzzle = createPuzzle(PuzzleStatus.APPROVED)
        val play = PlayEntity(
            puzzle = puzzle,
            subjectKey = subjectKey,
            mode = PuzzleMode.NORMAL,
            startedAt = Instant.now(),
            inputEvents = "[]"
        ).apply {
            finishedAt = Instant.now()
            lastSubmissionKey = "abc"
            lastSubmissionResult = objectMapper.writeValueAsString(
                PlayResultDto(
                    puzzleId = puzzle.id,
                    playId = this.id,
                    score = 777,
                    elapsedMs = 1_000,
                    comboBonus = 0,
                    perfectClear = true,
                    leaderboardRank = 5
                )
            )
        }
        val playId = play.id
        every { playRepository.findById(playId) } returns Optional.of(play)

        val result = service.submit(playId, subjectKey, PlaySubmitRequest(listOf("#"), 1_000, 0, 0, 0, 0), "abc")

        assertEquals(777, result.score)
        verify(exactly = 0) { puzzleSolutionRepository.findById(any()) }
        verify(exactly = 0) { scoreRepository.save(any()) }
        verify(exactly = 0) { leaderboardCacheService.recordPlayResult(any()) }
    }

    private fun createPuzzle(status: PuzzleStatus): PuzzleEntity =
        PuzzleEntity(
            title = "Puzzle",
            description = null,
            width = 2,
            height = 2,
            authorId = subjectKey,
            authorAnonId = null,
            status = status,
            contentStyle = PuzzleContentStyle.GENERIC_PIXEL
        )
}
