package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleValidationResult
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleValidationService
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleAuthorDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleDetailDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleHintDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleStatDto
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleHintEntity
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID
import kotlin.math.abs
import kotlin.math.max

@Component
class PuzzleMetadataResolver(
    private val objectMapper: ObjectMapper,
    private val puzzleValidationService: PuzzleValidationService
) {

    fun analyzeGrid(grid: List<String>, puzzle: PuzzleEntity): ResolvedPuzzleMetadata {
        val analysis = runAnalysis(grid)
        val rowsJson = objectMapper.writeValueAsString(analysis.validation.hints.rows)
        val colsJson = objectMapper.writeValueAsString(analysis.validation.hints.columns)
        val solutionBytes = puzzleValidationService.encodeSolution(analysis.grid)
        val checksum = analysis.validation.checksum
        val heuristics = deriveHeuristics(grid)

        return ResolvedPuzzleMetadata(
            rowsJson = rowsJson,
            colsJson = colsJson,
            solutionBytes = solutionBytes,
            checksum = checksum,
            contentStyle = heuristics.contentStyle,
            textScore = heuristics.textScore,
            tags = heuristics.tags,
            unique = analysis.validation.solver.uniqueSolution,
            difficultyScore = analysis.validation.solver.difficultyScore,
            difficultyCategory = resolveDifficultyLabel(analysis.validation.solver.difficultyScore) ?: "UNKNOWN",
            estimatedTimeMs = analysis.validation.estimatedMinutes.toLong() * 60_000
        )
    }

    fun composeDetail(
        puzzle: PuzzleEntity,
        hint: PuzzleHintEntity?
    ): PuzzleDetailDto {
        val hintDto = if (hint != null) {
            PuzzleHintDto(
                rows = parseHintArray(hint.rows),
                cols = parseHintArray(hint.cols)
            )
        } else {
            PuzzleHintDto(rows = emptyList(), cols = emptyList())
        }
        val authorKey = puzzle.authorId ?: puzzle.authorAnonId
        val authorDto = authorKey?.let {
            PuzzleAuthorDto(
                subjectKey = it,
                nickname = null,
                isOfficial = puzzle.status == org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus.OFFICIAL
            )
        }
        return PuzzleDetailDto(
            id = puzzle.id,
            title = puzzle.title,
            description = puzzle.description,
            width = puzzle.width,
            height = puzzle.height,
            status = puzzle.status,
            author = authorDto,
            contentStyle = puzzle.contentStyle,
            textLikenessScore = puzzle.textLikenessScore,
            difficultyScore = puzzle.difficultyScore,
            difficultyCategory = resolveDifficultyLabel(puzzle.difficultyScore),
            hints = hintDto,
            statistics = PuzzleStatDto(
                viewCount = puzzle.viewCount,
                playCount = puzzle.playCount,
                clearCount = puzzle.clearCount,
                averageTimeMs = puzzle.averageTimeMs,
                averageRating = puzzle.averageRating
            ),
            modes = listOf(org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode.NORMAL, org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode.TIME_ATTACK)
        )
    }

    private fun runAnalysis(grid: List<String>): PuzzleAnalysisPayload {
        val parsedGrid = puzzleValidationService.parseSolutionPayload(grid)
        val validation = puzzleValidationService.validateSolution(parsedGrid)
        if (!validation.solver.uniqueSolution) {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "퍼즐이 유일해를 만족하지 않습니다.")
        }
        return PuzzleAnalysisPayload(parsedGrid, validation)
    }

    fun parseDailyPickItems(payload: String): List<UUID> =
        runCatching { objectMapper.readValue<List<UUID>>(payload) }.getOrElse { emptyList() }

    fun resolveDifficultyLabel(difficultyScore: Double?): String? {
        val score = difficultyScore ?: return null
        return when {
            score < 3.0 -> "EASY"
            score < 6.0 -> "MEDIUM"
            score < 8.0 -> "HARD"
            else -> "EXPERT"
        }
    }

    private fun parseHintArray(raw: String): List<List<Int>> =
        runCatching { objectMapper.readValue<List<List<Int>>>(raw) }.getOrElse { emptyList() }

    private fun deriveHeuristics(grid: List<String>): GridHeuristics {
        if (grid.isEmpty() || grid.firstOrNull().isNullOrEmpty()) {
            return GridHeuristics(0.0, 0.0, 0.0, 0.0, PuzzleContentStyle.GENERIC_PIXEL, listOf("small", "sparse"))
        }
        val height = grid.size
        val width = grid.first().length
        val totalCells = height * width
        val filledCells = grid.sumOf { row -> row.count { it == FILLED } }
        val filledRatio = if (totalCells == 0) 0.0 else filledCells.toDouble() / totalCells.toDouble()
        val columnStrokeRatio = computeColumnStrokeRatio(grid)
        val normalizedSegments = computeSegmentScore(grid)
        val textScore = ((columnStrokeRatio + normalizedSegments) / 2.0).coerceIn(0.0, 1.0)
        val asciiScore = computeAsciiScore(grid)
        val symmetryScore = computeSymmetryScore(grid)
        val contentStyle = when {
            symmetryScore > 0.85 && textScore < 0.8 -> PuzzleContentStyle.SYMBOLIC
            textScore > 0.6 -> PuzzleContentStyle.LETTERFORM
            asciiScore > 0.5 -> PuzzleContentStyle.CLI_ASCII
            filledRatio > 0.55 -> PuzzleContentStyle.MIXED
            else -> PuzzleContentStyle.GENERIC_PIXEL
        }
        val tags = mutableSetOf<String>()
        tags += when {
            max(height, width) > 35 -> "large"
            max(height, width) >= 20 -> "medium"
            else -> "small"
        }
        tags += if (filledRatio > 0.5) "dense" else "sparse"
        if (textScore > 0.6) tags += "textual"
        if (symmetryScore > 0.75) tags += "symmetrical"
        if (filledRatio < 0.2) tags += "minimal"

        return GridHeuristics(
            textScore = textScore,
            symmetryScore = symmetryScore,
            asciiScore = asciiScore,
            density = filledRatio,
            contentStyle = contentStyle,
            tags = tags.toList()
        )
    }

    private fun computeColumnStrokeRatio(grid: List<String>): Double {
        val height = grid.size
        val width = grid.first().length
        if (width == 0) return 0.0
        var strokeColumns = 0
        for (x in 0 until width) {
            var filled = 0
            for (y in 0 until height) {
                if (grid[y][x] == FILLED) filled++
            }
            if (filled in 1 until height) strokeColumns++
        }
        return strokeColumns.toDouble() / width.toDouble()
    }

    private fun computeSegmentScore(grid: List<String>): Double {
        val width = grid.first().length
        if (width == 0) return 0.0
        val maxSegmentsPerRow = max(1, width / 2)
        val segmentTotal = grid.sumOf { countSegments(it) }
        val normalized = segmentTotal.toDouble() / (grid.size * maxSegmentsPerRow.toDouble())
        return normalized.coerceIn(0.0, 1.0)
    }

    private fun computeAsciiScore(grid: List<String>): Double {
        val width = grid.first().length
        if (width <= 1) return 0.0
        val transitions = grid.sumOf { row ->
            row.zipWithNext().count { (a, b) -> a != b }
        }
        val maxTransitions = grid.size * (width - 1)
        return (transitions.toDouble() / maxTransitions).coerceIn(0.0, 1.0)
    }

    private fun computeSymmetryScore(grid: List<String>): Double {
        val height = grid.size
        val width = grid.first().length
        if (width == 0 || height == 0) return 0.0
        var matches = 0
        var total = 0
        for (y in 0 until height) {
            for (x in 0 until width) {
                val mirrorX = width - 1 - x
                val mirrorY = height - 1 - y
                if (mirrorX >= 0) {
                    total++
                    if (grid[y][x] == grid[y][mirrorX]) matches++
                }
                if (mirrorY >= 0) {
                    total++
                    if (grid[y][x] == grid[mirrorY][x]) matches++
                }
            }
        }
        return if (total == 0) 0.0 else (matches.toDouble() / total.toDouble()).coerceIn(0.0, 1.0)
    }

    private fun countSegments(row: String): Int {
        var streak = 0
        var segments = 0
        for (char in row) {
            if (char == FILLED) {
                streak++
            } else if (streak > 0) {
                segments++
                streak = 0
            }
        }
        if (streak > 0) segments++
        return segments
    }

}

data class ResolvedPuzzleMetadata(
    val rowsJson: String,
    val colsJson: String,
    val solutionBytes: ByteArray,
    val checksum: String,
    val contentStyle: PuzzleContentStyle,
    val textScore: Double,
    val tags: List<String>,
    val unique: Boolean,
    val difficultyScore: Double,
    val difficultyCategory: String,
    val estimatedTimeMs: Long
) {
    fun applyTo(puzzle: PuzzleEntity) {
        puzzle.textLikenessScore = textScore
        puzzle.difficultyScore = difficultyScore
        puzzle.contentStyle = contentStyle
        val mergedTags = (puzzle.tags + tags).toSet()
        puzzle.tags.clear()
        puzzle.tags.addAll(mergedTags)
        puzzle.uniquenessFlag = unique
    }
}

private data class PuzzleAnalysisPayload(
    val grid: Array<BooleanArray>,
    val validation: PuzzleValidationResult
)

private data class GridHeuristics(
    val textScore: Double,
    val symmetryScore: Double,
    val asciiScore: Double,
    val density: Double,
    val contentStyle: PuzzleContentStyle,
    val tags: List<String>
)

private const val FILLED = '#'
