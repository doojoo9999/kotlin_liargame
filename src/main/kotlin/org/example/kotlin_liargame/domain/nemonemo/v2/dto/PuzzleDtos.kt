package org.example.kotlin_liargame.domain.nemonemo.v2.dto

import com.fasterxml.jackson.databind.JsonNode
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleReviewDecision
import java.time.LocalDateTime
import java.time.Instant
import java.util.UUID

data class PuzzleSummaryDto(
    val id: UUID,
    val title: String,
    val width: Int,
    val height: Int,
    val status: PuzzleStatus,
    val difficultyScore: Double?,
    val difficultyCategory: String?,
    val thumbnailUrl: String?,
    val tags: List<String>,
    val playCount: Long,
    val updatedAt: LocalDateTime
)

data class PuzzleDetailDto(
    val id: UUID,
    val title: String,
    val description: String?,
    val width: Int,
    val height: Int,
    val status: PuzzleStatus,
    val author: PuzzleAuthorDto?,
    val contentStyle: PuzzleContentStyle,
    val textLikenessScore: Double,
    val difficultyScore: Double?,
    val difficultyCategory: String?,
    val hints: PuzzleHintDto,
    val statistics: PuzzleStatDto,
    val modes: List<PuzzleMode>
)

data class PuzzleAuthorDto(
    val subjectKey: UUID,
    val nickname: String?,
    val isOfficial: Boolean
)

data class PuzzleHintDto(
    val rows: List<List<Int>>,
    val cols: List<List<Int>>
)

data class PuzzleStatDto(
    val viewCount: Long,
    val playCount: Long,
    val clearCount: Long,
    val averageTimeMs: Long?,
    val averageRating: Double?
)

data class PuzzleListResponse(
    val items: List<PuzzleSummaryDto>,
    val nextCursor: String?
)

data class PuzzleCreateRequest(
    val title: String,
    val description: String?,
    val width: Int,
    val height: Int,
    val grid: List<String>,
    val tags: List<String>,
    val seriesId: UUID?,
    val contentStyle: PuzzleContentStyle?
)

data class PuzzleCreateResponse(
    val puzzleId: UUID,
    val status: PuzzleStatus,
    val metadata: PuzzleMetadataDto,
    val rejectionReason: String?,
    val reviewNotes: String?,
    val reviewerKey: UUID?,
    val reviewedAt: Instant?
)

data class PuzzleReviewRequest(
    val decision: PuzzleReviewDecision,
    val reviewNotes: String?,
    val rejectionReason: String?
)

data class PuzzleReviewResponse(
    val puzzleId: UUID,
    val status: PuzzleStatus,
    val reviewNotes: String?,
    val rejectionReason: String?,
    val reviewerKey: UUID?,
    val reviewedAt: Instant?
)

data class PuzzleOfficialRequest(
    val notes: String?
)

data class PuzzleMetadataDto(
    val contentStyle: PuzzleContentStyle,
    val textLikenessScore: Double,
    val tags: List<String>,
    val uniqueness: Boolean,
    val difficultyScore: Double,
    val difficultyCategory: String,
    val solvingTimeEstimateMs: Long
)

data class DailyPickResponse(
    val date: String,
    val items: List<PuzzleSummaryDto>
)

data class PuzzleAuditLogDto(
    val id: UUID,
    val action: String,
    val actorKey: UUID,
    val payload: JsonNode?,
    val createdAt: LocalDateTime
)
