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
    val snapshot: Map<String, Any?>,
    val mistakes: Int,
    val undoCount: Int,
    val usedHints: Int
)

data class PlaySubmitRequest(
    val solution: List<String>,
    val elapsedMs: Long,
    val mistakes: Int,
    val usedHints: Int,
    val undoCount: Int,
    val comboCount: Int
)

data class PlayResultDto(
    val puzzleId: UUID,
    val playId: UUID,
    val score: Int,
    val elapsedMs: Long,
    val comboBonus: Int,
    val perfectClear: Boolean,
    val leaderboardRank: Int?
)

data class PlayDetailResponse(
    val playId: UUID,
    val puzzleId: UUID,
    val snapshot: Map<String, Any?>?,
    val startedAt: Instant,
    val lastSavedAt: Instant?,
    val stateToken: String
)
