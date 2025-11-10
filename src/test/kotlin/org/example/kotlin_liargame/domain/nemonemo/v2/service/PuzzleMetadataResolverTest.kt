package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.databind.ObjectMapper
import io.mockk.every
import io.mockk.mockk
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleDifficulty
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleValidationResult
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleValidationService
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleHints
import org.example.kotlin_liargame.domain.nemonemo.solver.PuzzleSolverResult
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

class PuzzleMetadataResolverTest {

    private val puzzleValidationService: PuzzleValidationService = mockk()
    private val resolver = PuzzleMetadataResolver(ObjectMapper(), puzzleValidationService)

    init {
        val validationResult = PuzzleValidationResult(
            hints = PuzzleHints(rows = listOf(listOf(1)), columns = listOf(listOf(1))),
            solver = PuzzleSolverResult(uniqueSolution = true, solutionsFound = 1, visitedNodes = 100, difficultyScore = 4.4, solution = null),
            difficulty = PuzzleDifficulty.MEDIUM,
            estimatedMinutes = 5,
            checksum = "checksum"
        )
        every { puzzleValidationService.parseSolutionPayload(any()) } answers { gridToBooleanArray(firstArg()) }
        every { puzzleValidationService.validateSolution(any()) } returns validationResult
        every { puzzleValidationService.encodeSolution(any()) } returns byteArrayOf(1)
    }

    @Test
    fun `letter-like grid classified as LETTERFORM`() {
        val grid = listOf(
            "..#..",
            ".#.#.",
            "#####",
            "#...#",
            "#...#"
        )
        val puzzle = newPuzzle()
        val metadata = resolver.analyzeGrid(grid, puzzle)
        assertEquals(PuzzleContentStyle.LETTERFORM, metadata.contentStyle)
        assertEquals(true, metadata.tags.contains("textual"))
    }

    @Test
    fun `symmetrical pattern classified as SYMBOLIC`() {
        val grid = listOf(
            "..#..",
            ".###.",
            "#####",
            ".###.",
            "..#.."
        )
        val puzzle = newPuzzle()
        val metadata = resolver.analyzeGrid(grid, puzzle)
        assertEquals(PuzzleContentStyle.SYMBOLIC, metadata.contentStyle)
        assertEquals(true, metadata.tags.contains("symmetrical"))
    }

    private fun gridToBooleanArray(rows: List<String>): Array<BooleanArray> =
        Array(rows.size) { y ->
            BooleanArray(rows[y].length) { x -> rows[y][x] == '#' }
        }

    private fun newPuzzle(): PuzzleEntity = PuzzleEntity(
        title = "Test",
        description = null,
        width = 5,
        height = 5,
        authorId = UUID.randomUUID(),
        authorAnonId = null,
        status = PuzzleStatus.DRAFT,
        contentStyle = PuzzleContentStyle.GENERIC_PIXEL
    )
}
