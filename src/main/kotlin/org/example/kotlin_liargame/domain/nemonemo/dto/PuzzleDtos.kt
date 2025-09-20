package org.example.kotlin_liargame.domain.nemonemo.dto

import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoPuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleDifficulty

data class PuzzleSummaryDto(
    val id: Long,
    val code: String,
    val title: String,
    val difficulty: PuzzleDifficulty,
    val width: Int,
    val height: Int,
    val estimatedMinutes: Int
) {
    companion object {
        fun from(entity: NemonemoPuzzleEntity) = PuzzleSummaryDto(
            id = entity.id,
            code = entity.code,
            title = entity.title,
            difficulty = entity.difficulty,
            width = entity.width,
            height = entity.height,
            estimatedMinutes = entity.estimatedMinutes
        )
    }
}

data class PuzzlePageResponse(
    val items: List<PuzzleSummaryDto>,
    val page: Int,
    val totalPages: Int,
    val totalItems: Long
)

data class PuzzleDetailResponse(
    val id: Long,
    val code: String,
    val title: String,
    val description: String?,
    val difficulty: PuzzleDifficulty,
    val width: Int,
    val height: Int,
    val estimatedMinutes: Int,
    val availableActions: List<String> = emptyList()
) {
    companion object {
        fun from(entity: NemonemoPuzzleEntity) = PuzzleDetailResponse(
            id = entity.id,
            code = entity.code,
            title = entity.title,
            description = entity.description,
            difficulty = entity.difficulty,
            width = entity.width,
            height = entity.height,
            estimatedMinutes = entity.estimatedMinutes
        )
    }
}
