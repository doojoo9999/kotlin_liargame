package org.example.kotlin_liargame.domain.nemonemo.V1.dto

import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoPuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleDifficulty
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleLifecycleStatus
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleSourceType
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleHints
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleValidationResult

data class AdminPuzzleUpsertRequest(
    val code: String,
    val title: String,
    val description: String?,
    val solution: List<String>,
    val sourceType: PuzzleSourceType? = null,
    val status: PuzzleLifecycleStatus? = null,
    val estimatedMinutes: Int? = null,
    val creatorUserId: Long? = null
)

data class AdminPuzzleValidateRequest(
    val solution: List<String>
)

data class PuzzleHintPayload(
    val rows: List<List<Int>>,
    val columns: List<List<Int>>
)

data class AdminPuzzleListItemResponse(
    val id: Long,
    val code: String,
    val title: String,
    val status: PuzzleLifecycleStatus,
    val difficulty: PuzzleDifficulty,
    val difficultyScore: Double?,
    val width: Int,
    val height: Int
) {
    companion object {
        fun from(entity: NemonemoPuzzleEntity, hints: PuzzleHintPayload): AdminPuzzleListItemResponse {
            return AdminPuzzleListItemResponse(
                id = entity.id,
                code = entity.code,
                title = entity.title,
                status = entity.status,
                difficulty = entity.difficulty,
                difficultyScore = entity.difficultyScore,
                width = entity.width,
                height = entity.height
            )
        }
    }
}

data class AdminPuzzlePageResponse(
    val items: List<AdminPuzzleListItemResponse>,
    val page: Int,
    val totalPages: Int,
    val totalItems: Long
)

data class AdminPuzzleDetailResponse(
    val id: Long,
    val code: String,
    val title: String,
    val description: String?,
    val status: PuzzleLifecycleStatus,
    val difficulty: PuzzleDifficulty,
    val difficultyScore: Double?,
    val estimatedMinutes: Int,
    val width: Int,
    val height: Int,
    val hints: PuzzleHintPayload,
    val solutionMetrics: AdminPuzzleValidationMetadata
) {
    companion object {
        fun from(
            entity: NemonemoPuzzleEntity,
            hints: PuzzleHintPayload,
            validation: PuzzleValidationResult? = null
        ): AdminPuzzleDetailResponse {
            val metrics = validation?.let {
                AdminPuzzleValidationMetadata(
                    uniqueSolution = it.solver.uniqueSolution,
                    solutionCount = it.solver.solutionsFound,
                    visitedNodes = it.solver.visitedNodes,
                    checksum = it.checksum
                )
            } ?: AdminPuzzleValidationMetadata(
                uniqueSolution = entity.status != PuzzleLifecycleStatus.DRAFT,
                solutionCount = 1,
                visitedNodes = entity.difficultyScore?.toInt() ?: 0,
                checksum = entity.validationChecksum
            )

            return AdminPuzzleDetailResponse(
                id = entity.id,
                code = entity.code,
                title = entity.title,
                description = entity.description,
                status = entity.status,
                difficulty = entity.difficulty,
                difficultyScore = entity.difficultyScore,
                estimatedMinutes = entity.estimatedMinutes,
                width = entity.width,
                height = entity.height,
                hints = hints,
                solutionMetrics = metrics
            )
        }
    }
}

data class AdminPuzzleValidationMetadata(
    val uniqueSolution: Boolean,
    val solutionCount: Int,
    val visitedNodes: Int,
    val checksum: String?
)

data class AdminPuzzleValidateResponse(
    val uniqueSolution: Boolean,
    val solutionCount: Int,
    val visitedNodes: Int,
    val difficulty: PuzzleDifficulty,
    val difficultyScore: Double,
    val estimatedMinutes: Int,
    val hints: PuzzleHintPayload,
    val checksum: String
)
