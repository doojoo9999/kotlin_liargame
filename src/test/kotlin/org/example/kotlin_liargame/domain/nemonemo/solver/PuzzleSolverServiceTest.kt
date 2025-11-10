package org.example.kotlin_liargame.domain.nemonemo.solver

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class PuzzleSolverServiceTest {

    private val service = PuzzleSolverService()

    @Test
    fun `solve completes simple puzzle`() {
        val rows = listOf(listOf(3))
        val cols = listOf(listOf(1), listOf(1), listOf(1))
        val result = service.solve(rows, cols)
        assertEquals(true, result.uniqueSolution)
    }

    @Test
    fun `solve aborts when timeout exceeded`() {
        val rows = List(5) { listOf(2) }
        val cols = List(5) { listOf(2) }
        assertThrows<PuzzleSolverTimeoutException> {
            service.solve(rows, cols, timeoutMillis = 0)
        }
    }
}
