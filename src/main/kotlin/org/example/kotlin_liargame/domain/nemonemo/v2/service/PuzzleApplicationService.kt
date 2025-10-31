package org.example.kotlin_liargame.domain.nemonemo.v2.service

import org.example.kotlin_liargame.domain.nemonemo.v2.dto.DailyPickResponse
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleCreateRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleCreateResponse
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleDetailDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleListResponse
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleMetadataDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleSummaryDto
import org.example.kotlin_liargame.domain.nemonemo.v2.model.DailyPickEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleHintEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleSolutionEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.DailyPickRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleHintRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleSolutionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
class PuzzleApplicationService(
    private val puzzleRepository: PuzzleRepository,
    private val puzzleHintRepository: PuzzleHintRepository,
    private val puzzleSolutionRepository: PuzzleSolutionRepository,
    private val dailyPickRepository: DailyPickRepository,
    private val metadataResolver: PuzzleMetadataResolver
) {

    fun listPuzzles(
        status: PuzzleStatus,
        page: Int,
        size: Int
    ): PuzzleListResponse {
        val all = puzzleRepository.findByStatusOrderByCreatedAtDesc(status)
        val fromIndex = (page * size).coerceAtMost(all.size)
        val toIndex = (fromIndex + size).coerceAtMost(all.size)
        val slice = if (fromIndex < toIndex) all.subList(fromIndex, toIndex) else emptyList()
        val summaries = slice.map(::toSummary)
        val nextCursor = if (toIndex < all.size) "${status.name}:${page + 1}" else null
        return PuzzleListResponse(
            items = summaries,
            nextCursor = nextCursor
        )
    }

    fun getPuzzleDetail(puzzleId: UUID): PuzzleDetailDto? {
        val puzzle = puzzleRepository.findById(puzzleId).orElse(null) ?: return null
        val hint = puzzleHintRepository.findById(puzzleId).orElse(null)
        return metadataResolver.composeDetail(puzzle, hint)
    }

    @Transactional
    fun createPuzzle(
        request: PuzzleCreateRequest,
        authorKey: UUID?
    ): PuzzleCreateResponse {
        val puzzle = PuzzleEntity(
            title = request.title,
            description = request.description,
            width = request.width,
            height = request.height,
            authorId = authorKey,
            authorAnonId = if (authorKey == null) UUID.randomUUID() else null,
            contentStyle = request.contentStyle ?: PuzzleContentStyle.GENERIC_PIXEL
        ).apply {
            tags.addAll(request.tags)
        }

        val savedPuzzle = puzzleRepository.save(puzzle)

        val metadata = metadataResolver.analyzeGrid(request.grid, savedPuzzle)

        puzzleHintRepository.save(
            PuzzleHintEntity(
                puzzleId = savedPuzzle.id,
                rows = metadata.rowsJson,
                cols = metadata.colsJson,
                version = 1
            )
        )

        puzzleSolutionRepository.save(
            PuzzleSolutionEntity(
                puzzleId = savedPuzzle.id,
                gridData = metadata.solutionBytes,
                checksum = metadata.checksum
            )
        )

        metadata.applyTo(savedPuzzle)
        puzzleRepository.save(savedPuzzle)

        val responseMetadata = PuzzleMetadataDto(
            contentStyle = metadata.contentStyle,
            textLikenessScore = metadata.textScore,
            tags = metadata.tags,
            uniqueness = metadata.unique,
            difficultyScore = metadata.difficultyScore,
            difficultyCategory = metadata.difficultyCategory,
            solvingTimeEstimateMs = metadata.estimatedTimeMs
        )

        return PuzzleCreateResponse(
            puzzleId = savedPuzzle.id,
            status = savedPuzzle.status,
            metadata = responseMetadata,
            rejectionReason = null,
            reviewNotes = null
        )
    }

    fun getDailyPicks(date: LocalDate = LocalDate.now()): DailyPickResponse {
        val pick = dailyPickRepository.findById(date).orElseGet {
            dailyPickRepository.save(
                DailyPickEntity(
                    pickDate = date,
                    items = "[]"
                )
            )
        }
        val puzzleIds = metadataResolver.parseDailyPickItems(pick.items)
        val puzzles = puzzleRepository.findAllById(puzzleIds)
        val summaries = puzzles.map(::toSummary)
        return DailyPickResponse(
            date = pick.pickDate.toString(),
            items = summaries
        )
    }

    private fun toSummary(entity: PuzzleEntity): PuzzleSummaryDto = PuzzleSummaryDto(
        id = entity.id,
        title = entity.title,
        width = entity.width,
        height = entity.height,
        status = entity.status,
        difficultyScore = entity.difficultyScore,
        difficultyCategory = metadataResolver.resolveDifficultyLabel(entity.difficultyScore),
        thumbnailUrl = entity.thumbnailUrl,
        tags = entity.tags.toList(),
        playCount = entity.playCount,
        updatedAt = entity.modifiedAt
    )
}
