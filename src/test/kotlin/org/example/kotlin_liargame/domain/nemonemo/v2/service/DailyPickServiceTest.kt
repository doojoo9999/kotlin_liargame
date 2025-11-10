package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.DailyPickResponse
import org.example.kotlin_liargame.domain.nemonemo.v2.model.DailyPickEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.DailyPickRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.Optional
import java.util.UUID

class DailyPickServiceTest {

    private val dailyPickRepository: DailyPickRepository = mockk(relaxed = true)
    private val puzzleRepository: PuzzleRepository = mockk()
    private val objectMapper = jacksonObjectMapper()
    private val clock: Clock = Clock.fixed(Instant.parse("2025-11-10T00:00:00Z"), ZoneOffset.UTC)

    private val service = DailyPickService(
        dailyPickRepository = dailyPickRepository,
        puzzleRepository = puzzleRepository,
        objectMapper = objectMapper,
        clock = clock
    )

    @Test
    fun `generateDailyPick selects diversified lineup`() {
        val date = LocalDate.of(2025, 11, 10)
        every { dailyPickRepository.findById(date) } returns Optional.empty()
        every { dailyPickRepository.findAllByPickDateBetween(any(), any()) } returns emptyList()
        every {
            puzzleRepository.findTop300ByStatusInOrderByCreatedAtDesc(any())
        } returns sampleCandidates()
        val savedSlot = slot<DailyPickEntity>()
        every { dailyPickRepository.save(capture(savedSlot)) } answers { savedSlot.captured }

        val response = service.generateDailyPick(date, force = true)

        assertEquals(4, response.items.size)
        assertTrue(response.items.any { it.difficultyCategory == "EASY" })
        assertTrue(response.items.any { it.difficultyCategory == "HARD" || it.difficultyCategory == "EXPERT" })
        verify { dailyPickRepository.save(any()) }
    }

    @Test
    fun `getDailyPick reuses stored lineup`() {
        val date = LocalDate.of(2025, 11, 9)
        val puzzle = candidatePuzzle(title = "Stored", difficulty = 4.0)
        val stored = DailyPickEntity(
            pickDate = date,
            items = objectMapper.writeValueAsString(listOf(puzzle.id)),
            generatedAt = Instant.now(clock)
        )
        every { dailyPickRepository.findById(date) } returns Optional.of(stored)
        every { puzzleRepository.findAllById(any<Iterable<UUID>>()) } returns listOf(puzzle)

        val response = service.getDailyPick(date)

        assertEquals(1, response.items.size)
        assertEquals("Stored", response.items.first().title)
        verify(exactly = 0) { dailyPickRepository.save(any()) }
    }

    private fun sampleCandidates(): List<PuzzleEntity> = listOf(
        candidatePuzzle(title = "Easy", difficulty = 2.5, playCount = 120, clearCount = 60, averageRating = 4.2, contentStyle = PuzzleContentStyle.MIXED),
        candidatePuzzle(title = "MediumA", difficulty = 4.5, playCount = 300, clearCount = 120, averageRating = 4.0, contentStyle = PuzzleContentStyle.GENERIC_PIXEL),
        candidatePuzzle(title = "MediumB", difficulty = 5.0, playCount = 400, clearCount = 180, averageRating = 3.8, contentStyle = PuzzleContentStyle.CLI_ASCII),
        candidatePuzzle(title = "Hard", difficulty = 7.1, playCount = 500, clearCount = 200, averageRating = 4.5, contentStyle = PuzzleContentStyle.LETTERFORM),
        candidatePuzzle(title = "Fallback", difficulty = 3.5, playCount = 80, clearCount = 30, averageRating = 3.6, contentStyle = PuzzleContentStyle.GENERIC_PIXEL)
    )

    private fun candidatePuzzle(
        title: String,
        difficulty: Double,
        playCount: Long = 150,
        clearCount: Long = 60,
        averageRating: Double = 4.0,
        averageTimeMs: Long = 600_000,
        contentStyle: PuzzleContentStyle = PuzzleContentStyle.GENERIC_PIXEL,
        status: PuzzleStatus = PuzzleStatus.OFFICIAL
    ): PuzzleEntity {
        val puzzle = PuzzleEntity(
            title = title,
            description = null,
            width = 10,
            height = 10,
            authorId = UUID.randomUUID(),
            authorAnonId = null,
            status = status,
            contentStyle = contentStyle
        )
        puzzle.difficultyScore = difficulty
        puzzle.playCount = playCount
        puzzle.clearCount = clearCount
        puzzle.averageRating = averageRating
        puzzle.averageTimeMs = averageTimeMs
        return puzzle
    }
}
