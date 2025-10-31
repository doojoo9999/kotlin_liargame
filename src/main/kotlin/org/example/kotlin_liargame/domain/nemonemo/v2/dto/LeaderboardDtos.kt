package org.example.kotlin_liargame.domain.nemonemo.v2.dto

import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import java.time.Instant
import java.util.UUID

enum class LeaderboardWindow {
    PUZZLE,
    GLOBAL,
    WEEKLY,
    MONTHLY,
    AUTHOR
}

data class LeaderboardEntryDto(
    val rank: Int,
    val subjectKey: UUID,
    val nickname: String?,
    val score: Int,
    val timeMs: Long?,
    val combo: Int,
    val perfect: Boolean,
    val mode: PuzzleMode,
    val updatedAt: Instant
)

data class LeaderboardResponse(
    val window: LeaderboardWindow,
    val mode: PuzzleMode,
    val entries: List<LeaderboardEntryDto>,
    val generatedAt: Instant
)
