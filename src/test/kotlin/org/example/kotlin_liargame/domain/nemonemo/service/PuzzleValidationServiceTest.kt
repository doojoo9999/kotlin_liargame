package org.example.kotlin_liargame.domain.nemonemo.service

import io.mockk.every
import io.mockk.mockk
import org.example.kotlin_liargame.domain.nemonemo.solver.PuzzleSolverResult
import org.example.kotlin_liargame.domain.nemonemo.solver.PuzzleSolverService
import org.example.kotlin_liargame.domain.nemonemo.solver.PuzzleSolverTimeoutException
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException

class PuzzleValidationServiceTest {

    private val puzzleSolverService: PuzzleSolverService = mockk()
    private val service = PuzzleValidationService(puzzleSolverService, solverTimeoutMs = 10)

    @Test
    fun `timeout propagates as ResponseStatusException`() {
        every { puzzleSolverService.solve(any(), any(), any()) } throws PuzzleSolverTimeoutException("timeout")

        val exception = assertThrows<ResponseStatusException> {
            service.validateSolution(arrayOf(BooleanArray(1) { true }))
        }

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, exception.statusCode)
        assertEquals("PUZZLE_SOLVER_TIMEOUT", exception.reason)
    }

    @Test
    fun `validateSolution returns solver result when successful`() {
        every { puzzleSolverService.solve(any(), any(), any()) } returns PuzzleSolverResult(
            uniqueSolution = true,
            solutionsFound = 1,
            visitedNodes = 10,
            difficultyScore = 100.0,
            solution = null
        )

        val result = service.validateSolution(arrayOf(BooleanArray(1) { true }))
        assertEquals(true, result.solver.uniqueSolution)
    }
}
