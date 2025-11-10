package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.DailyPickResponse
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleSummaryDto
import org.example.kotlin_liargame.domain.nemonemo.v2.model.DailyPickEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.DailyPickRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID
import kotlin.math.abs
import kotlin.math.max

@Service
class DailyPickService(
    private val dailyPickRepository: DailyPickRepository,
    private val puzzleRepository: PuzzleRepository,
    private val objectMapper: ObjectMapper,
    private val clock: Clock
) {

    private val zoneId: ZoneId = ZoneId.of("Asia/Seoul")

    @Transactional(readOnly = true)
    fun getDailyPick(date: LocalDate = today()): DailyPickResponse {
        val existing = dailyPickRepository.findById(date)
        if (existing.isPresent) {
            return buildResponse(existing.get(), null)
        }
        val generated = generateAndPersist(date, force = true)
        return buildResponse(generated.first, generated.second)
    }

    @Transactional
    fun generateDailyPick(date: LocalDate = today(), force: Boolean = false): DailyPickResponse {
        val (entity, lineup) = generateAndPersist(date, force)
        return buildResponse(entity, lineup)
    }

    private fun generateAndPersist(date: LocalDate, force: Boolean): Pair<DailyPickEntity, List<PuzzleEntity>> {
        val existing = dailyPickRepository.findById(date).orElse(null)
        if (existing != null && !force && parseItems(existing.items).isNotEmpty()) {
            return existing to loadByIds(parseItems(existing.items))
        }
        val excluded = recentPickIds(date)
        val allCandidates = puzzleRepository.findTop300ByStatusInOrderByCreatedAtDesc(PLAYABLE_STATUSES)
        val filtered = filterCandidates(allCandidates, excluded)
        val lineup = selectLineup(filtered, excluded.toMutableSet(), allCandidates)
        val payload = objectMapper.writeValueAsString(lineup.map { it.id })
        val entity = existing?.apply {
            items = payload
            generatedAt = Instant.now(clock)
        } ?: DailyPickEntity(
            pickDate = date,
            items = payload,
            generatedAt = Instant.now(clock)
        )
        val saved = dailyPickRepository.save(entity)
        logger.info("Generated daily picks for {} with {} puzzles", date, lineup.size)
        return saved to lineup
    }

    private fun buildResponse(entity: DailyPickEntity, resolved: List<PuzzleEntity>?): DailyPickResponse {
        val summaries = resolved?.map(::toSummary) ?: run {
            val ids = parseItems(entity.items)
            val resolvedMap = loadByIds(ids).associateBy { it.id }
            ids.mapNotNull(resolvedMap::get).map(::toSummary)
        }
        return DailyPickResponse(
            date = entity.pickDate.toString(),
            items = summaries
        )
    }

    private fun filterCandidates(
        candidates: List<PuzzleEntity>,
        excluded: Set<UUID>
    ): List<PuzzleEntity> = candidates.asSequence()
        .filter { it.status in PLAYABLE_STATUSES }
        .filter { it.id !in excluded }
        .filter { it.playCount >= MIN_PLAY_COUNT }
        .filter { it.clearCount > 0 }
        .filter { it.averageTimeMs != null && it.averageTimeMs!! in AVERAGE_TIME_RANGE }
        .filter { (it.averageRating ?: 0.0) >= MIN_RATING }
        .filter { it.difficultyScore != null }
        .filter { candidate ->
            val rate = clearRate(candidate)
            rate in MIN_CLEAR_RATE..MAX_CLEAR_RATE
        }
        .toList()

    private fun selectLineup(
        filtered: List<PuzzleEntity>,
        excluded: MutableSet<UUID>,
        fallbackPool: List<PuzzleEntity>
    ): List<PuzzleEntity> {
        val useExcluded = if (filtered.isNotEmpty()) excluded else emptySet()
        val basePool = if (filtered.isNotEmpty()) filtered else fallbackPool
        if (basePool.isEmpty()) {
            return emptyList()
        }
        val sorted = basePool.sortedByDescending { rankingScore(it) }
        val picks = mutableListOf<PuzzleEntity>()
        val usedAuthors = mutableSetOf<UUID?>()
        val contentUsage = mutableMapOf<PuzzleContentStyle, Int>()

        outer@ for ((tier, targetCount) in TARGET_LAYOUT) {
            val bucket = sorted.filter { classifyDifficulty(it.difficultyScore) == tier }
            var collected = 0
            for (candidate in bucket) {
                if (picks.size >= MAX_PICKS) break@outer
                if (addCandidate(candidate, picks, usedAuthors, contentUsage, useExcluded)) {
                    collected++
                    if (collected >= targetCount) continue@outer
                }
            }
        }

        if (picks.size < MIN_PICKS) {
            for (candidate in sorted) {
                if (picks.size >= MAX_PICKS) break
                addCandidate(candidate, picks, usedAuthors, contentUsage, useExcluded)
            }
        }

        if (picks.size < MIN_PICKS) {
            for (candidate in sorted) {
                if (picks.size >= MIN_PICKS || picks.size >= MAX_PICKS) break
                val author = candidate.authorId ?: candidate.authorAnonId
                if (author !in usedAuthors) {
                    picks += candidate
                }
            }
        }
        return picks.take(MAX_PICKS)
    }

    private fun addCandidate(
        candidate: PuzzleEntity,
        picks: MutableList<PuzzleEntity>,
        usedAuthors: MutableSet<UUID?>,
        contentUsage: MutableMap<PuzzleContentStyle, Int>,
        excluded: Set<UUID>
    ): Boolean {
        if (candidate.id in excluded) return false
        val authorKey = candidate.authorId ?: candidate.authorAnonId
        if (authorKey != null && authorKey in usedAuthors) return false
        val lastAuthor = picks.lastOrNull()?.let { it.authorId ?: it.authorAnonId }
        if (lastAuthor != null && lastAuthor == authorKey) return false
        val styleCount = contentUsage.getOrDefault(candidate.contentStyle, 0)
        if (styleCount >= MAX_PER_STYLE && contentUsage.size < 2) {
            return false
        }
        usedAuthors += authorKey
        contentUsage[candidate.contentStyle] = styleCount + 1
        picks += candidate
        return true
    }

    private fun rankingScore(puzzle: PuzzleEntity): Double {
        val ratingScore = (puzzle.averageRating ?: DEFAULT_RATING) * 100
        val rateScore = (1 - abs(clearRate(puzzle) - TARGET_CLEAR_RATE)) * 50
        val recencyInstant = puzzle.officialAt ?: puzzle.approvedAt ?: puzzle.createdAt.atZone(zoneId).toInstant()
        val recencyScore = recencyInstant.epochSecond / 100_000.0
        return ratingScore + rateScore + recencyScore
    }

    private fun clearRate(puzzle: PuzzleEntity): Double {
        val plays = max(puzzle.playCount, 1)
        return (puzzle.clearCount.toDouble() / plays.toDouble()).coerceIn(0.0, 1.0)
    }

    private fun classifyDifficulty(score: Double?): DifficultyTier = when {
        score == null -> DifficultyTier.MEDIUM
        score < 3.0 -> DifficultyTier.EASY
        score < 6.0 -> DifficultyTier.MEDIUM
        else -> DifficultyTier.HARD
    }

    private fun toSummary(entity: PuzzleEntity): PuzzleSummaryDto = PuzzleSummaryDto(
        id = entity.id,
        title = entity.title,
        width = entity.width,
        height = entity.height,
        status = entity.status,
        difficultyScore = entity.difficultyScore,
        difficultyCategory = difficultyLabel(entity.difficultyScore),
        thumbnailUrl = entity.thumbnailUrl,
        tags = entity.tags.toList(),
        playCount = entity.playCount,
        updatedAt = entity.modifiedAt
    )

    private fun difficultyLabel(score: Double?): String? = when {
        score == null -> null
        score < 3.0 -> "EASY"
        score < 6.0 -> "MEDIUM"
        score < 8.0 -> "HARD"
        else -> "EXPERT"
    }

    private fun parseItems(payload: String): List<UUID> =
        runCatching { objectMapper.readValue<List<UUID>>(payload) }.getOrElse { emptyList() }

    private fun loadByIds(ids: List<UUID>): List<PuzzleEntity> =
        puzzleRepository.findAllById(ids).toList()

    private fun recentPickIds(date: LocalDate): Set<UUID> {
        val recent = dailyPickRepository.findAllByPickDateBetween(date.minusDays(7), date.minusDays(1))
        return recent.flatMap { parseItems(it.items) }.toSet()
    }

    private fun today(): LocalDate = LocalDate.now(zoneId)

    private enum class DifficultyTier { EASY, MEDIUM, HARD }

    companion object {
        private val logger = LoggerFactory.getLogger(DailyPickService::class.java)
        private val PLAYABLE_STATUSES = listOf(PuzzleStatus.APPROVED, PuzzleStatus.OFFICIAL)
        private const val MIN_PLAY_COUNT = 50L
        private const val MIN_RATING = 3.5
        private const val MIN_CLEAR_RATE = 0.2
        private const val MAX_CLEAR_RATE = 0.6
        private const val TARGET_CLEAR_RATE = 0.4
        private const val MAX_PER_STYLE = 2
        private const val MIN_PICKS = 3
        private const val MAX_PICKS = 5
        private val TARGET_LAYOUT = listOf(
            DifficultyTier.EASY to 1,
            DifficultyTier.MEDIUM to 2,
            DifficultyTier.HARD to 1
        )
        private val AVERAGE_TIME_RANGE = 240_000L..1_800_000L
        private const val DEFAULT_RATING = 3.5
    }
}
