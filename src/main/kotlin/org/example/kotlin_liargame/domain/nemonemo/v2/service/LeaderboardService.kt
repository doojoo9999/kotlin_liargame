package org.example.kotlin_liargame.domain.nemonemo.v2.service

import org.example.kotlin_liargame.domain.nemonemo.v2.dto.LeaderboardEntryDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.LeaderboardResponse
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.LeaderboardWindow
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.ScoreRepository
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

@Service
class LeaderboardService(
    private val scoreRepository: ScoreRepository,
    private val leaderboardCacheService: LeaderboardCacheService
) {

    fun fetchPuzzleLeaderboard(
        puzzleId: UUID,
        mode: PuzzleMode
    ): LeaderboardResponse {
        val entries = when (mode) {
            PuzzleMode.TIME_ATTACK -> scoreRepository.findTop100ByIdPuzzleIdAndIdModeOrderByBestTimeMsAsc(puzzleId, mode)
                .sortedBy { it.bestTimeMs ?: Long.MAX_VALUE }
            else -> scoreRepository.findTop100ByIdPuzzleIdOrderByBestScoreDesc(puzzleId)
                .sortedByDescending { it.bestScore ?: 0 }
        }
        val mapped = entries.mapIndexed { index, score ->
            LeaderboardEntryDto(
                rank = index + 1,
                subjectKey = score.id.subjectKey,
                nickname = null,
                score = score.bestScore ?: 0,
                timeMs = score.bestTimeMs,
                combo = 0,
                perfect = score.perfectClear,
                mode = score.id.mode,
                updatedAt = score.lastPlayedAt
            )
        }
        return LeaderboardResponse(
            window = LeaderboardWindow.PUZZLE,
            mode = mode,
            entries = mapped,
            generatedAt = Instant.now()
        )
    }

    fun fetchLeaderboard(
        window: LeaderboardWindow,
        mode: PuzzleMode,
        limit: Int
    ): LeaderboardResponse {
        require(window != LeaderboardWindow.PUZZLE) { "Puzzle leaderboards are served via fetchPuzzleLeaderboard" }
        val normalizedLimit = limit.coerceIn(1, 100)
        val referenceTime = Instant.now()
        val cachedEntries = leaderboardCacheService.fetchEntries(window, mode, normalizedLimit, referenceTime)
        val entries = if (cachedEntries.isNotEmpty()) cachedEntries else fallbackEntries(window, mode, normalizedLimit)
        return LeaderboardResponse(
            window = window,
            mode = mode,
            entries = entries,
            generatedAt = referenceTime
        )
    }

    private fun fallbackEntries(
        window: LeaderboardWindow,
        mode: PuzzleMode,
        limit: Int
    ): List<LeaderboardEntryDto> = when (window) {
        LeaderboardWindow.GLOBAL -> buildGlobalFallback(mode, limit)
        LeaderboardWindow.WEEKLY -> buildGlobalFallback(mode, limit)
        LeaderboardWindow.MONTHLY -> buildGlobalFallback(mode, limit)
        LeaderboardWindow.AUTHOR -> emptyList()
        LeaderboardWindow.PUZZLE -> emptyList()
    }

    private fun buildGlobalFallback(
        mode: PuzzleMode,
        limit: Int
    ): List<LeaderboardEntryDto> {
        val grouped = scoreRepository.findAll()
            .filter { it.id.mode == mode }
            .groupBy { it.id.subjectKey }
            .map { (subjectKey, scores) ->
                subjectKey to scores.sumOf { it.bestScore ?: 0 }
            }
            .sortedByDescending { it.second }
            .take(limit)

        return grouped.mapIndexed { index, (subjectKey, totalScore) ->
            LeaderboardEntryDto(
                rank = index + 1,
                subjectKey = subjectKey,
                nickname = null,
                score = totalScore,
                timeMs = null,
                combo = 0,
                perfect = false,
                mode = mode,
                updatedAt = Instant.now()
            )
        }
    }
}
