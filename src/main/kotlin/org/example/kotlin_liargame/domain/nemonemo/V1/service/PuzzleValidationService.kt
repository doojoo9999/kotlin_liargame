package org.example.kotlin_liargame.domain.nemonemo.service

import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleDifficulty
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleGridCodec
import org.example.kotlin_liargame.domain.nemonemo.solver.PuzzleSolverResult
import org.example.kotlin_liargame.domain.nemonemo.solver.PuzzleSolverService
import org.example.kotlin_liargame.domain.nemonemo.solver.PuzzleSolverTimeoutException
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.security.MessageDigest
import kotlin.math.log10
import kotlin.math.max
import kotlin.math.roundToInt

@Service
class PuzzleValidationService(
    private val puzzleSolverService: PuzzleSolverService,
    @Value("\${nemonemo.solver.timeout-ms:30000}")
    private val solverTimeoutMs: Long
) {

    fun validateSolution(grid: Array<BooleanArray>): PuzzleValidationResult {
        val hints = generateHints(grid)
        val solverResult = try {
            puzzleSolverService.solve(hints.rows, hints.columns, solverTimeoutMs)
        } catch (ex: PuzzleSolverTimeoutException) {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "PUZZLE_SOLVER_TIMEOUT")
        }
        val difficulty = inferDifficulty(solverResult)
        val estimatedMinutes = estimateMinutes(grid, solverResult)
        val checksum = computeChecksum(grid)

        return PuzzleValidationResult(
            hints = hints,
            solver = solverResult,
            difficulty = difficulty,
            estimatedMinutes = estimatedMinutes,
            checksum = checksum
        )
    }

    fun generateHints(grid: Array<BooleanArray>): PuzzleHints {
        val rowHints = grid.map { line ->
            extractHints(line)
        }
        val height = grid.size
        val width = grid.firstOrNull()?.size ?: 0
        val columnHints = (0 until width).map { columnIndex ->
            val columnLine = BooleanArray(height) { rowIndex -> grid[rowIndex][columnIndex] }
            extractHints(columnLine)
        }
        return PuzzleHints(rows = rowHints, columns = columnHints)
    }

    fun parseSolutionPayload(rows: List<String>): Array<BooleanArray> {
        return PuzzleGridCodec.fromStringRows(rows)
    }

    fun encodeSolution(grid: Array<BooleanArray>): ByteArray {
        return PuzzleGridCodec.encode(grid)
    }

    fun decodeSolution(blob: ByteArray, width: Int, height: Int): Array<BooleanArray> {
        return PuzzleGridCodec.decode(blob, width, height)
    }

    private fun inferDifficulty(result: PuzzleSolverResult): PuzzleDifficulty {
        val score = result.difficultyScore
        return when {
            score < 150 -> PuzzleDifficulty.EASY
            score < 260 -> PuzzleDifficulty.MEDIUM
            score < 360 -> PuzzleDifficulty.HARD
            else -> PuzzleDifficulty.EXPERT
        }
    }

    private fun estimateMinutes(grid: Array<BooleanArray>, result: PuzzleSolverResult): Int {
        val area = grid.size * (grid.firstOrNull()?.size ?: 0)
        val baseMinutes = max(5.0, area / 45.0)
        val complexityFactor = log10(result.visitedNodes.toDouble() + 10.0) * 3.0
        return (baseMinutes + complexityFactor).roundToInt()
    }

    private fun extractHints(line: BooleanArray): List<Int> {
        if (line.isEmpty()) return emptyList()
        val hints = mutableListOf<Int>()
        var streak = 0
        for (cell in line) {
            if (cell) {
                streak++
            } else if (streak > 0) {
                hints += streak
                streak = 0
            }
        }
        if (streak > 0) {
            hints += streak
        }
        return if (hints.isEmpty()) listOf(0) else hints
    }

        private fun computeChecksum(grid: Array<BooleanArray>): String {
        val digest = MessageDigest.getInstance("SHA-256")
        for (row in grid) {
            for (cell in row) {
                digest.update((if (cell) 1 else 0).toByte())
            }
        }
        return digest.digest().joinToString(separator = "") { byte ->
            val value = byte.toInt() and 0xff
            value.toString(16).padStart(2, '0')
        }
    }
}

data class PuzzleValidationResult(
    val hints: PuzzleHints,
    val solver: PuzzleSolverResult,
    val difficulty: PuzzleDifficulty,
    val estimatedMinutes: Int,
    val checksum: String
)

data class PuzzleHints(
    val rows: List<List<Int>>,
    val columns: List<List<Int>>
)
