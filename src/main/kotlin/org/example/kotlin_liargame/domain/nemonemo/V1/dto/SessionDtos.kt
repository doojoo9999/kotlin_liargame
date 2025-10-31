package org.example.kotlin_liargame.domain.nemonemo.V1.dto

import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoSessionEntity
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleSessionStatus
import java.time.LocalDateTime

data class SessionResponseDto(
    val sessionId: Long,
    val puzzleId: Long,
    val status: PuzzleSessionStatus,
    val mistakes: Int,
    val hintsUsed: Int,
    val startedAt: LocalDateTime,
    val completedAt: LocalDateTime?,
    val finalScore: Int?,
    val durationSeconds: Int?
) {
    companion object {
        fun from(entity: NemonemoSessionEntity) = SessionResponseDto(
            sessionId = entity.id,
            puzzleId = entity.puzzle.id,
            status = entity.status,
            mistakes = entity.mistakeCount,
            hintsUsed = entity.hintUsed,
            startedAt = entity.startedAt,
            completedAt = entity.completedAt,
            finalScore = entity.finalScore,
            durationSeconds = entity.durationSeconds
        )
    }
}

data class SessionStartRequestDto(
    val puzzleId: Long,
    val resume: Boolean = true
)

data class SessionActionRequestDto(
    val actions: List<CellActionDto>,
    val mistakeCount: Int? = null,
    val hintsUsed: Int? = null,
    val durationSeconds: Int? = null
)

data class CellActionDto(
    val x: Int,
    val y: Int,
    val state: String
)

data class SessionCompletionRequestDto(
    val finalScore: Int,
    val durationSeconds: Int,
    val mistakes: Int,
    val hintsUsed: Int,
    val accuracy: Double? = null
)

data class SessionCompletionResponseDto(
    val sessionId: Long,
    val score: Int,
    val pointsAwarded: Int,
    val rankEstimate: Int?,
    val completionTimeSeconds: Int
)
