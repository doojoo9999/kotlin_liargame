package org.example.kotlin_liargame.domain.nemonemo.v2

import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleValidationService
import org.example.kotlin_liargame.domain.nemonemo.solver.PuzzleSolverService
import org.junit.jupiter.api.Assumptions.assumeTrue
import org.junit.jupiter.api.Test

class TutorialPuzzleGeneratorTest {

    private val validationService = PuzzleValidationService(PuzzleSolverService(), 30_000)

    private fun toBooleanGrid(rows: List<String>): Array<BooleanArray> =
        rows.map { row -> BooleanArray(row.length) { idx -> row[idx] == '#' } }.toTypedArray()

    private fun randomGrid(width: Int, height: Int, fillRatio: Double): List<String> {
        return List(height) {
            buildString(width) {
                repeat(width) {
                    append(if (Math.random() < fillRatio) '#' else '.')
                }
            }
        }
    }

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

    private fun findUnique(width: Int, height: Int, fillRatio: Double, count: Int): List<List<String>> {
        val results = mutableListOf<List<String>>()
        var attempts = 0
        val limit = if (width >= 15 || height >= 15) 2_000_000 else 500_000
        while (results.size < count && attempts < limit) {
            attempts++
            val grid = randomGrid(width, height, fillRatio)
            if (hasIsolatedCell(grid)) continue
            val solution = validationService.validateSolution(toBooleanGrid(grid))
            if (solution.solver.uniqueSolution) {
                results += grid
            }
        }
        return results
    }

    @Test
    fun generateSamples() {
        assumeTrue(System.getenv("TUTORIAL_GEN") == "true")
        val configs = listOf(
            5 to listOf(0.45, 0.55),
            10 to listOf(0.35, 0.45, 0.55),
            15 to listOf(0.25, 0.3, 0.35, 0.4, 0.45, 0.5),
            20 to listOf(0.2, 0.25, 0.3, 0.35, 0.4, 0.45)
        )
        val filter = System.getenv("TUTORIAL_GEN_SIZE")
            ?.split(',')
            ?.mapNotNull { it.trim().toIntOrNull() }
            ?.toSet()
        val filtered = configs.filter { filter == null || filter.contains(it.first) }
        for ((size, ratios) in filtered) {
            val collected = mutableListOf<List<String>>()
            for (ratio in ratios) {
                if (collected.size >= 2) break
                val needed = 2 - collected.size
                val found = findUnique(size, size, ratio, needed)
                collected += found
            }
            println("=== $size x $size (${collected.size}개) ===")
            collected.forEachIndexed { index, grid ->
                println("# ${index + 1}")
                grid.forEach { println(it) }
                println()
            }
        }
    }
}
