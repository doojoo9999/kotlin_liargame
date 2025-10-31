package org.example.kotlin_liargame.domain.nemonemo.service

import org.example.kotlin_liargame.domain.nemonemo.dto.AdminPuzzleDetailResponse
import org.example.kotlin_liargame.domain.nemonemo.dto.AdminPuzzleListItemResponse
import org.example.kotlin_liargame.domain.nemonemo.dto.AdminPuzzleUpsertRequest
import org.example.kotlin_liargame.domain.nemonemo.dto.AdminPuzzleValidateRequest
import org.example.kotlin_liargame.domain.nemonemo.dto.AdminPuzzleValidateResponse
import org.example.kotlin_liargame.domain.nemonemo.dto.PuzzleHintPayload
import org.example.kotlin_liargame.domain.nemonemo.model.HintAxis
import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoPuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoPuzzleHintEntity
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleLifecycleStatus
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleSourceType
import org.example.kotlin_liargame.domain.nemonemo.repository.NemonemoPuzzleHintRepository
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleHints
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleValidationResult
import org.example.kotlin_liargame.domain.nemonemo.repository.NemonemoPuzzleRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class NemonemoPuzzleAdminService(
    private val puzzleRepository: NemonemoPuzzleRepository,
    private val puzzleHintRepository: NemonemoPuzzleHintRepository,
    private val validationService: PuzzleValidationService
) {

    @Transactional(readOnly = true)
    fun listPuzzles(page: Int, size: Int, status: PuzzleLifecycleStatus?): Page<AdminPuzzleListItemResponse> {
        val pageable = PageRequest.of(page, size)
        val pageResult = when (status) {
            null -> puzzleRepository.findAll(pageable)
            else -> puzzleRepository.findAllByStatus(status, pageable)
        }
        return pageResult.map { puzzle ->
            val hints = loadHints(puzzle)
            AdminPuzzleListItemResponse.from(puzzle, hints)
        }
    }

    @Transactional(readOnly = true)
    fun getPuzzleDetail(puzzleId: Long): AdminPuzzleDetailResponse {
        val puzzle = puzzleRepository.findById(puzzleId)
            .orElseThrow { NemonemoResourceNotFoundException("Puzzle $puzzleId not found") }
        val hints = loadHints(puzzle)
        return AdminPuzzleDetailResponse.from(puzzle, hints)
    }

    @Transactional
    fun createPuzzle(request: AdminPuzzleUpsertRequest): AdminPuzzleDetailResponse {
        require(request.solution.isNotEmpty()) { "Puzzle solution grid must not be empty" }
        require(puzzleRepository.findByCode(request.code) == null) {
            "Puzzle code ${request.code} already exists"
        }
        val grid = validationService.parseSolutionPayload(request.solution)
        val validation = validationService.validateSolution(grid)
        val status = request.status ?: PuzzleLifecycleStatus.DRAFT
        val estimatedMinutes = request.estimatedMinutes ?: validation.estimatedMinutes
        val sourceType = request.sourceType ?: PuzzleSourceType.OFFICIAL

        val entity = puzzleRepository.save(
            NemonemoPuzzleEntity(
                code = request.code,
                title = request.title,
                description = request.description,
                width = grid.first().size,
                height = grid.size,
                solutionBlob = validationService.encodeSolution(grid),
                difficulty = validation.difficulty,
                estimatedMinutes = estimatedMinutes,
                sourceType = sourceType,
                status = status
            ).apply {
                difficultyScore = validation.solver.difficultyScore
                validationChecksum = validation.checksum
                creatorUserId = request.creatorUserId
            }
        )

        persistHints(entity, validation.hints)

        val hintPayload = PuzzleHintPayload(
            rows = validation.hints.rows,
            columns = validation.hints.columns
        )

        return AdminPuzzleDetailResponse.from(entity, hintPayload, validation)
    }

    @Transactional
    fun updatePuzzle(puzzleId: Long, request: AdminPuzzleUpsertRequest): AdminPuzzleDetailResponse {
        val puzzle = puzzleRepository.findById(puzzleId)
            .orElseThrow { NemonemoResourceNotFoundException("Puzzle $puzzleId not found") }
        require(request.code == puzzle.code) {
            "Puzzle code cannot be changed"
        }

        var validationResult: PuzzleValidationResult? = null
        val grid = if (request.solution.isNotEmpty()) {
            validationService.parseSolutionPayload(request.solution)
        } else {
            validationService.decodeSolution(puzzle.solutionBlob, puzzle.width, puzzle.height)
        }

        if (request.solution.isNotEmpty()) {
            validationResult = validationService.validateSolution(grid)
            puzzle.solutionBlob = validationService.encodeSolution(grid)
            puzzle.difficulty = validationResult.difficulty
            puzzle.difficultyScore = validationResult.solver.difficultyScore
            puzzle.validationChecksum = validationResult.checksum
            persistHints(puzzle, validationResult.hints, replaceExisting = true)
        }

        puzzle.title = request.title
        puzzle.description = request.description
        puzzle.sourceType = request.sourceType ?: puzzle.sourceType
        puzzle.status = request.status ?: puzzle.status
        puzzle.creatorUserId = request.creatorUserId ?: puzzle.creatorUserId
        puzzle.estimatedMinutes = request.estimatedMinutes ?: validationResult?.estimatedMinutes ?: puzzle.estimatedMinutes

        val hints = validationResult?.hints?.let {
            PuzzleHintPayload(rows = it.rows, columns = it.columns)
        } ?: loadHints(puzzle)
        val finalValidation = validationResult ?: validationService.validateSolution(grid)

        return AdminPuzzleDetailResponse.from(puzzle, hints, finalValidation)
    }

    private fun persistHints(
        puzzle: NemonemoPuzzleEntity,
        hints: PuzzleHints,
        replaceExisting: Boolean = true
    ) {
        if (replaceExisting) {
            puzzleHintRepository.deleteAllByPuzzle(puzzle)
        }
        val rowHints = hints.rows.mapIndexed { index, values ->
            NemonemoPuzzleHintEntity(
                puzzle = puzzle,
                axis = HintAxis.ROW,
                positionIndex = index,
                hintValues = values.joinToString(",")
            )
        }
        val columnHints = hints.columns.mapIndexed { index, values ->
            NemonemoPuzzleHintEntity(
                puzzle = puzzle,
                axis = HintAxis.COLUMN,
                positionIndex = index,
                hintValues = values.joinToString(",")
            )
        }
        puzzleHintRepository.saveAll(rowHints + columnHints)
    }

    @Transactional(readOnly = true)
    fun previewValidation(request: AdminPuzzleValidateRequest): AdminPuzzleValidateResponse {
        val grid = validationService.parseSolutionPayload(request.solution)
        val validation = validationService.validateSolution(grid)
        val payload = PuzzleHintPayload(
            rows = validation.hints.rows,
            columns = validation.hints.columns
        )

        return AdminPuzzleValidateResponse(
            uniqueSolution = validation.solver.uniqueSolution,
            solutionCount = validation.solver.solutionsFound,
            visitedNodes = validation.solver.visitedNodes,
            difficulty = validation.difficulty,
            difficultyScore = validation.solver.difficultyScore,
            estimatedMinutes = validation.estimatedMinutes,
            hints = payload,
            checksum = validation.checksum
        )
    }

    private fun loadHints(puzzle: NemonemoPuzzleEntity): PuzzleHintPayload {
        val rows = puzzleHintRepository
            .findAllByPuzzleAndAxisOrderByPositionIndexAsc(puzzle, HintAxis.ROW)
            .map { hint -> parseHintValues(hint.hintValues) }
        val columns = puzzleHintRepository
            .findAllByPuzzleAndAxisOrderByPositionIndexAsc(puzzle, HintAxis.COLUMN)
            .map { hint -> parseHintValues(hint.hintValues) }
        return PuzzleHintPayload(rows = rows, columns = columns)
    }

    private fun parseHintValues(values: String): List<Int> {
        if (values.isBlank()) return emptyList()
        return values.split(',').mapNotNull { token ->
            token.trim().takeIf { it.isNotEmpty() }?.toInt()
        }
    }
}
