package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleAuthorDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleDetailDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleHintDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleStatDto
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleHintEntity
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.time.Instant
import java.util.UUID

@Component
class PuzzleMetadataResolver(
    private val objectMapper: ObjectMapper
) {

    fun analyzeGrid(grid: List<String>, puzzle: PuzzleEntity): ResolvedPuzzleMetadata {
        val flattened = grid.joinToString(separator = "")
        val filledCells = flattened.count { it == '#' }
        val totalCells = puzzle.width * puzzle.height
        val density = if (totalCells == 0) 0.0 else filledCells.toDouble() / totalCells

        val difficultyScore = (density * 5.0) + (grid.size / 10.0)
        val difficultyCategory = resolveDifficultyLabel(difficultyScore)
        val estimatedTime = (totalCells * (1 + density)).toLong() * 1500

        val rows = grid.map { row ->
            row.split(Regex("\\.+")).filter { it.isNotEmpty() }.map(String::length)
        }
        val cols = (0 until puzzle.width).map { x ->
            val columnString = grid.joinToString("") { it[x].toString() }
            columnString.split(Regex("\\.+")).filter { it.isNotEmpty() }.map(String::length)
        }

        val rowsJson = objectMapper.writeValueAsString(rows)
        val colsJson = objectMapper.writeValueAsString(cols)
        val solutionBytes = flattened.toByteArray(StandardCharsets.UTF_8)
        val checksum = checksum(solutionBytes)

        return ResolvedPuzzleMetadata(
            rowsJson = rowsJson,
            colsJson = colsJson,
            solutionBytes = solutionBytes,
            checksum = checksum,
            contentStyle = puzzle.contentStyle,
            textScore = if (flattened.any { it.isLetter() }) 0.8 else 0.1,
            tags = deriveTags(grid),
            unique = true,
            difficultyScore = difficultyScore,
            difficultyCategory = difficultyCategory?:"UNKNOWN",
            estimatedTimeMs = estimatedTime
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

    private fun deriveTags(grid: List<String>): List<String> {
        val size = grid.size
        val tags = mutableListOf<String>()
        if (size <= 10) tags += "small"
        if (size in 11..20) tags += "medium"
        if (size > 20) tags += "large"
        val filledRatio = grid.sumOf { row -> row.count { it == '#' } }.toDouble() / (grid.size * grid.first().length)
        if (filledRatio > 0.5) tags += "dense" else tags += "sparse"
        return tags
    }

    private fun checksum(bytes: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(bytes)
        return digest.joinToString("") { "%02x".format(it) }
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
        puzzle.tags.clear()
        puzzle.tags.addAll(tags)
        puzzle.uniquenessFlag = unique
    }
}
