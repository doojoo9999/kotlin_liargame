package org.example.kotlin_liargame.domain.nemonemo.v2.service

import org.example.kotlin_liargame.domain.nemonemo.v2.dto.LeaderboardEntryDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.LeaderboardResponse
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.LeaderboardWindow
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PlayEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PlayRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.ScoreRepository
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

@Service
class LeaderboardService(
    private val scoreRepository: ScoreRepository,
    private val playRepository: PlayRepository
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

    fun fetchRecentGlobalLeaderboard(): LeaderboardResponse {
        // Placeholder: use latest plays aggregated by score
        val recentPlays = playRepository.findAll().sortedByDescending { it.createdAt }.take(50)
        val mapped = recentPlays.mapIndexed { index, play ->
            LeaderboardEntryDto(
                rank = index + 1,
                subjectKey = play.subjectKey,
                nickname = null,
                score = play.comboCount * 10,
                timeMs = play.finishedAt?.let { it.toEpochMilli() - play.startedAt.toEpochMilli() },
                combo = play.comboCount,
                perfect = play.mistakes == 0,
                mode = play.mode,
                updatedAt = play.finishedAt ?: play.startedAt
            )
        }
        return LeaderboardResponse(
            window = LeaderboardWindow.GLOBAL,
            mode = PuzzleMode.NORMAL,
            entries = mapped,
            generatedAt = Instant.now()
        )
    }
}
