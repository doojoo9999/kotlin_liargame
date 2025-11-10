package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.LeaderboardEntryDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.LeaderboardWindow
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Service
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.time.temporal.TemporalAdjusters
import java.time.temporal.WeekFields
import java.util.Locale
import java.util.UUID

@Service
class LeaderboardCacheService @Autowired constructor(
    private val objectMapper: ObjectMapper,
    private val clock: Clock,
    @Autowired(required = false) private val stringRedisTemplate: StringRedisTemplate?
) {

    fun recordPlayResult(record: LeaderboardRecord) {
        val redis = stringRedisTemplate ?: return
        val finishedAt = record.finishedAt

        listOfNotNull(
            descriptorFor(LeaderboardWindow.GLOBAL, record.mode, finishedAt),
            descriptorFor(LeaderboardWindow.WEEKLY, record.mode, finishedAt),
            descriptorFor(LeaderboardWindow.MONTHLY, record.mode, finishedAt),
            descriptorFor(LeaderboardWindow.AUTHOR, record.mode, finishedAt)
        ).forEach { descriptor ->
            updateWindow(redis, descriptor, record)
        }
    }

    fun fetchEntries(
        window: LeaderboardWindow,
        mode: PuzzleMode,
        limit: Int,
        referenceTime: Instant = Instant.now(clock)
    ): List<LeaderboardEntryDto> {
        val redis = stringRedisTemplate ?: return emptyList()
        val descriptor = descriptorFor(window, mode, referenceTime) ?: return emptyList()
        val trimmedLimit = limit.coerceAtLeast(1)
        val tuples = redis.opsForZSet().reverseRangeWithScores(descriptor.key, 0, (trimmedLimit - 1).toLong())
            ?: return emptyList()
        if (tuples.isEmpty()) {
            return emptyList()
        }
        val ids = tuples.mapNotNull { it.value }
        val metaRaw = if (ids.isEmpty()) emptyList<String?>() else redis.opsForHash<String, String>().multiGet(descriptor.metaKey, ids)
        return tuples.mapIndexed { index, tuple ->
            val payload = metaRaw.getOrNull(index)?.let { deserializePayload(it) }
            toDto(index, tuple.value ?: return@mapIndexed null, window, descriptor.modeForEntry(payload, mode), payload)
        }.filterNotNull()
    }

    private fun toDto(
        index: Int,
        memberId: String,
        window: LeaderboardWindow,
        mode: PuzzleMode,
        payload: LeaderboardCachePayload?
    ): LeaderboardEntryDto {
        val aggregateScore = (payload?.totalScore ?: 0.0).toInt()
        return LeaderboardEntryDto(
            rank = index + 1,
            subjectKey = UUID.fromString(memberId),
            nickname = null,
            score = aggregateScore,
            timeMs = payload?.timeMs,
            combo = payload?.combo ?: 0,
            perfect = payload?.perfect ?: false,
            mode = if (window == LeaderboardWindow.AUTHOR) PuzzleMode.NORMAL else (payload?.mode ?: mode),
            updatedAt = payload?.updatedAt ?: Instant.now(clock)
        )
    }

    private fun LeaderboardDescriptor.modeForEntry(payload: LeaderboardCachePayload?, fallback: PuzzleMode): PuzzleMode =
        payload?.mode ?: this.mode ?: fallback

    private fun updateWindow(
        redis: StringRedisTemplate,
        descriptor: LeaderboardDescriptor,
        record: LeaderboardRecord
    ) {
        val memberId = descriptor.memberId(record) ?: return
        val totalScore = redis.opsForZSet().incrementScore(descriptor.key, memberId, record.finalScore.toDouble()) ?: record.finalScore.toDouble()
        val payload = LeaderboardCachePayload(
            subjectKey = UUID.fromString(memberId),
            totalScore = totalScore,
            lastScore = record.finalScore,
            timeMs = record.elapsedMs,
            combo = record.comboCount,
            perfect = record.mistakes == 0,
            mode = record.mode,
            updatedAt = record.finishedAt
        )
        redis.opsForHash<String, String>().put(descriptor.metaKey, memberId, objectMapper.writeValueAsString(payload))
        descriptor.ttl?.let {
            redis.expire(descriptor.key, it)
            redis.expire(descriptor.metaKey, it)
        }
    }

    private fun descriptorFor(
        window: LeaderboardWindow,
        mode: PuzzleMode,
        referenceTime: Instant
    ): LeaderboardDescriptor? {
        val windowId = when (window) {
            LeaderboardWindow.GLOBAL -> "all"
            LeaderboardWindow.WEEKLY -> weekOf(referenceTime)
            LeaderboardWindow.MONTHLY -> monthOf(referenceTime)
            LeaderboardWindow.AUTHOR -> "all"
            LeaderboardWindow.PUZZLE -> return null
        }
        val ttl = when (window) {
            LeaderboardWindow.WEEKLY -> WEEKLY_TTL
            LeaderboardWindow.MONTHLY -> MONTHLY_TTL
            else -> null
        }
        val modeSegment = when (window) {
            LeaderboardWindow.AUTHOR -> "all"
            else -> mode.name.lowercase(Locale.US)
        }
        val redisKey = "nemo:lb:${window.name.lowercase(Locale.US)}:$modeSegment:$windowId"
        val metaKey = "nemo:lb:meta:${window.name.lowercase(Locale.US)}:$modeSegment:$windowId"
        val memberResolver: (LeaderboardRecord) -> String? = when (window) {
            LeaderboardWindow.AUTHOR -> { rec -> rec.authorKey?.toString() }
            else -> { rec -> rec.subjectKey.toString() }
        }
        val descriptorMode = if (window == LeaderboardWindow.AUTHOR) PuzzleMode.NORMAL else mode
        return LeaderboardDescriptor(redisKey, metaKey, ttl, descriptorMode, memberResolver)
    }

    private fun weekOf(instant: Instant): String {
        val zoneDate = instant.atZone(ZoneOffset.UTC)
        val weekFields = WeekFields.ISO
        val monday = zoneDate.with(weekFields.dayOfWeek(), 1)
        return monday.format(DATE_FORMAT)
    }

    private fun monthOf(instant: Instant): String {
        val zoneDate = instant.atZone(ZoneOffset.UTC)
        val firstDay = zoneDate.with(TemporalAdjusters.firstDayOfMonth())
        return firstDay.format(MONTH_FORMAT)
    }

    private fun deserializePayload(raw: String): LeaderboardCachePayload? =
        try {
            objectMapper.readValue(raw, LeaderboardCachePayload::class.java)
        } catch (_: Exception) {
            null
        }

    data class LeaderboardRecord(
        val subjectKey: UUID,
        val puzzleId: UUID,
        val authorKey: UUID?,
        val mode: PuzzleMode,
        val finalScore: Int,
        val elapsedMs: Long,
        val comboCount: Int,
        val mistakes: Int,
        val finishedAt: Instant
    )

    private data class LeaderboardDescriptor(
        val key: String,
        val metaKey: String,
        val ttl: Duration?,
        val mode: PuzzleMode?,
        val memberId: (LeaderboardRecord) -> String?
    )

    data class LeaderboardCachePayload(
        val subjectKey: UUID,
        val totalScore: Double,
        val lastScore: Int,
        val timeMs: Long?,
        val combo: Int,
        val perfect: Boolean,
        val mode: PuzzleMode,
        val updatedAt: Instant
    )

    companion object {
        private val DATE_FORMAT: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyyMMdd")
        private val MONTH_FORMAT: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyyMM")
        private val WEEKLY_TTL: Duration = Duration.ofDays(35)
        private val MONTHLY_TTL: Duration = Duration.ofDays(120)
    }
}
