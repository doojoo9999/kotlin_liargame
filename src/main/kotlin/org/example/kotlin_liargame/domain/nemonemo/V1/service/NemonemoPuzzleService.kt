package org.example.kotlin_liargame.domain.nemonemo.service

import org.example.kotlin_liargame.domain.nemonemo.dto.PuzzleDetailResponse
import org.example.kotlin_liargame.domain.nemonemo.dto.PuzzleHintPayload
import org.example.kotlin_liargame.domain.nemonemo.dto.PuzzlePageResponse
import org.example.kotlin_liargame.domain.nemonemo.dto.PuzzleSummaryDto
import org.example.kotlin_liargame.domain.nemonemo.model.HintAxis
import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoPuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleDifficulty
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleLifecycleStatus
import org.example.kotlin_liargame.domain.nemonemo.repository.NemonemoPuzzleHintRepository
import org.example.kotlin_liargame.domain.nemonemo.repository.NemonemoPuzzleReleaseRepository
import org.example.kotlin_liargame.domain.nemonemo.repository.NemonemoPuzzleRepository
import org.springframework.data.domain.PageRequest
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class NemonemoPuzzleService(
    private val puzzleRepository: NemonemoPuzzleRepository,
    private val puzzleReleaseRepository: NemonemoPuzzleReleaseRepository,
    private val puzzleHintRepository: NemonemoPuzzleHintRepository,
    private val puzzleValidationService: PuzzleValidationService
) {

    fun getPuzzles(page: Int, size: Int, difficulty: PuzzleDifficulty?, releasePack: String?): PuzzlePageResponse {
        val pageable = PageRequest.of(page, size)
        val status = PuzzleLifecycleStatus.PUBLISHED

        if (releasePack != null) {
            val now = LocalDateTime.now()
            val releaseEntries = puzzleReleaseRepository
                .findAllByReleasePackAndReleaseAtLessThanEqualOrderByReleaseAtDesc(releasePack, now)
            val puzzles = releaseEntries
                .mapNotNull { entry ->
                    entry.puzzle.takeIf { puzzle ->
                        puzzle.status == status && (difficulty == null || puzzle.difficulty == difficulty)
                    }
                }
            return PuzzlePageResponse(
                items = puzzles.map(PuzzleSummaryDto::from),
                page = 0,
                totalPages = 1,
                totalItems = puzzles.size.toLong()
            )
        }

        val pageResult = when (difficulty) {
            null -> puzzleRepository.findAllByStatus(status, pageable)
            else -> puzzleRepository.findAllByStatusAndDifficulty(status, difficulty, pageable)
        }

        return PuzzlePageResponse(
            items = pageResult.content.map(PuzzleSummaryDto::from),
            page = pageResult.number,
            totalPages = pageResult.totalPages,
            totalItems = pageResult.totalElements
        )
    }

    fun getPuzzleDetail(puzzleId: Long): PuzzleDetailResponse? {
        val puzzle = puzzleRepository.findByIdOrNull(puzzleId) ?: return null
        if (puzzle.status != PuzzleLifecycleStatus.PUBLISHED) {
            return null
        }
        val hints = loadHints(puzzle)
        return PuzzleDetailResponse.from(puzzle)
    }

    private fun loadHints(puzzle: NemonemoPuzzleEntity): PuzzleHintPayload {
        val rowHints = puzzleHintRepository
            .findAllByPuzzleAndAxisOrderByPositionIndexAsc(puzzle, HintAxis.ROW)
            .map { parseHintValues(it.hintValues) }
        val columnHints = puzzleHintRepository
            .findAllByPuzzleAndAxisOrderByPositionIndexAsc(puzzle, HintAxis.COLUMN)
            .map { parseHintValues(it.hintValues) }
        if (rowHints.isEmpty() || columnHints.isEmpty()) {
            val grid = puzzleValidationService.decodeSolution(puzzle.solutionBlob, puzzle.width, puzzle.height)
            val generated = puzzleValidationService.generateHints(grid)
            return org.example.kotlin_liargame.domain.nemonemo.dto.PuzzleHintPayload(
                rows = generated.rows,
                columns = generated.columns
            )
        }
        return org.example.kotlin_liargame.domain.nemonemo.dto.PuzzleHintPayload(rows = rowHints, columns = columnHints)
    }

    private fun parseHintValues(raw: String): List<Int> {
        if (raw.isBlank()) return emptyList()
        return raw.split(',')
            .mapNotNull { token -> token.trim().takeIf { it.isNotEmpty() }?.toInt() }
    }
}
