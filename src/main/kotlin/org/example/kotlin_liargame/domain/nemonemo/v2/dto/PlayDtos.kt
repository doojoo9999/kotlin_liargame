package org.example.kotlin_liargame.domain.nemonemo.v2.dto

import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import java.time.Instant
import java.util.UUID

data class PlayStartRequest(
    val mode: PuzzleMode = PuzzleMode.NORMAL
)

data class PlayStartResponse(
    val playId: UUID,
    val stateToken: String,
    val expiresAt: Instant
)

data class PlayAutosaveRequest(
    val progress: Map<String, Any>,
    val timestamp: Instant
)

data class PlaySubmitRequest(
    val finalGrid: String,
    val mistakes: Int,
    val usedHints: Int,
    val undoCount: Int,
    val comboCount: Int,
    val durationMs: Long
)

data class PlayResultDto(
    val puzzleId: UUID,
    val playId: UUID,
    val score: Int,
    val timeMs: Long,
    val comboBonus: Int,
    val perfectClear: Boolean,
    val leaderboardRank: Int?
)
