package org.example.kotlin_liargame.domain.nemonemo.v2.service

import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleSummaryDto
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.ScoreRepository
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.ZoneOffset
import java.util.UUID
import kotlin.math.abs
import kotlin.math.max

@Service
class PersonalizedRecommendationService(
    private val scoreRepository: ScoreRepository,
    private val puzzleRepository: PuzzleRepository
) {

    fun getRecommendations(subjectKey: UUID, limit: Int): List<PuzzleSummaryDto> {
        val trimmedLimit = limit.coerceIn(3, 10)
        val history = scoreRepository.findByIdSubjectKey(subjectKey, PageRequest.of(0, 50))
        val historyIds = history.map { it.id.puzzleId }.toSet()
        val historicalPuzzles = if (historyIds.isEmpty()) emptyMap() else puzzleRepository.findAllById(historyIds).associateBy { it.id }
        val preferences = derivePreferences(historicalPuzzles.values.toList())

        val candidates = puzzleRepository.findTop300ByStatusInOrderByCreatedAtDesc(PLAYABLE_STATUSES)
            .filter { it.id !in historyIds }

        val ranked = if (candidates.isEmpty()) emptyList() else candidates
            .sortedByDescending { scoreCandidate(it, preferences) }
            .take(trimmedLimit)

        val fallback = if (ranked.size < trimmedLimit) {
            candidates.filterNot { ranked.contains(it) }.take(trimmedLimit - ranked.size)
        } else emptyList()

        return (ranked + fallback).distinctBy { it.id }.take(trimmedLimit).map(::toSummary)
    }

    private fun derivePreferences(history: List<PuzzleEntity>): PreferenceProfile {
        if (history.isEmpty()) {
            return PreferenceProfile()
        }
        val difficultyAvg = history.mapNotNull { it.difficultyScore }.ifEmpty { null }?.average() ?: 4.0
        val dominantTags = history.flatMap { it.tags }.groupingBy { it }.eachCount().entries
            .sortedByDescending { it.value }.take(5).map { it.key }
        val styleCounts = history.groupingBy { it.contentStyle }.eachCount()
        val favoriteStyle = styleCounts.maxByOrNull { it.value }?.key
        val recentInstant = history.maxOfOrNull { it.modifiedAt.atZone(ZoneOffset.UTC).toInstant() } ?: Instant.now()
        return PreferenceProfile(
            targetDifficulty = difficultyAvg,
            preferredTags = dominantTags,
            favoriteStyle = favoriteStyle,
            recentInstant = recentInstant
        )
    }

    private fun scoreCandidate(puzzle: PuzzleEntity, prefs: PreferenceProfile): Double {
        val difficulty = puzzle.difficultyScore ?: 4.0
        val difficultyScore = 1.0 - (abs(difficulty - prefs.targetDifficulty) / 10.0)
        val tagOverlap = if (prefs.preferredTags.isEmpty()) 0.0 else {
            val overlap = puzzle.tags.count { prefs.preferredTags.contains(it) }
            overlap.toDouble() / prefs.preferredTags.size.toDouble()
        }
        val styleScore = if (prefs.favoriteStyle == null) 0.0 else if (prefs.favoriteStyle == puzzle.contentStyle) 0.2 else 0.0
        val recencyScore = puzzle.modifiedAt.atZone(ZoneOffset.UTC).toInstant().epochSecond / 1_000_000.0
        return difficultyScore + tagOverlap + styleScore + recencyScore
    }

    private fun toSummary(entity: PuzzleEntity): PuzzleSummaryDto = PuzzleSummaryDto(
        id = entity.id,
        title = entity.title,
        width = entity.width,
        height = entity.height,
        status = entity.status,
        difficultyScore = entity.difficultyScore,
        difficultyCategory = null,
        thumbnailUrl = entity.thumbnailUrl,
        tags = entity.tags.toList(),
        playCount = entity.playCount,
        updatedAt = entity.modifiedAt
    )

    private data class PreferenceProfile(
        val targetDifficulty: Double = 4.0,
        val preferredTags: List<String> = emptyList(),
        val favoriteStyle: PuzzleContentStyle? = null,
        val recentInstant: Instant = Instant.now()
    )

    companion object {
        private val PLAYABLE_STATUSES = listOf(PuzzleStatus.APPROVED, PuzzleStatus.OFFICIAL)
    }
}
