package org.example.kotlin_liargame.domain.nemonemo.v2

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import java.nio.file.Files
import java.nio.file.Paths
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleValidationService
import org.example.kotlin_liargame.domain.nemonemo.solver.PuzzleSolverService
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class TutorialPuzzleManualCheckTest {

    private val validationService = PuzzleValidationService(PuzzleSolverService(), 30_000)
    private val mapper = jacksonObjectMapper()

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class TutorialPuzzleSet(val puzzles: List<TutorialPuzzle>)
    @JsonIgnoreProperties(ignoreUnknown = true)
    data class TutorialPuzzle(
        val slug: String,
        val title: String,
        val grid: List<String>
    )

    private fun toBooleanGrid(rows: List<String>) =
        rows.map { row -> BooleanArray(row.length) { idx -> row[idx] == '#' } }.toTypedArray()

    private fun hasIsolatedCell(grid: List<String>): Boolean {
        val height = grid.size
        val width = grid.firstOrNull()?.length ?: 0
        val deltas = listOf(1 to 0, -1 to 0, 0 to 1, 0 to -1)
        for (y in 0 until height) {
            for (x in 0 until width) {
                if (grid[y][x] != '#') continue
                val hasNeighbor = deltas.any { (dx, dy) ->
                    val nx = x + dx
                    val ny = y + dy
                    nx in 0 until width && ny in 0 until height && grid[ny][nx] == '#'
                }
                if (!hasNeighbor) return true
            }
        }
        return false
    }

    private fun loadPuzzles(): List<TutorialPuzzle> {
        val path = Paths.get("docs/nemonemo/tutorial_puzzles.json")
        assertTrue(Files.exists(path), "tutorial_puzzles.json not found")
        val json = Files.readString(path)
        val payload = mapper.readValue<TutorialPuzzleSet>(json)
        assertFalse(payload.puzzles.isEmpty(), "tutorial puzzle list is empty")
        return payload.puzzles
    }

    @Test
    fun tutorialSeedsAreUnique() {
        loadPuzzles().forEach { puzzle ->
            assertFalse(puzzle.grid.isEmpty(), "Puzzle ${puzzle.slug} has empty grid")
            val width = puzzle.grid.first().length
            assertTrue(puzzle.grid.all { it.length == width }, "Puzzle ${puzzle.slug} rows mismatch width")
            assertTrue(!hasIsolatedCell(puzzle.grid), "Puzzle ${puzzle.slug} has isolated cell")
            val result = validationService.validateSolution(toBooleanGrid(puzzle.grid))
            assertTrue(result.solver.uniqueSolution, "Puzzle ${puzzle.slug} is not unique")
        }
    }
}
