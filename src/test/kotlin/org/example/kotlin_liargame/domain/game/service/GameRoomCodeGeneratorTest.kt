package org.example.kotlin_liargame.domain.game.service

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class GameRoomCodeGeneratorTest {
    private val gameRepository = mockk<GameRepository>()

    @Test
    fun `generates random room number within six digit range`() {
        every { gameRepository.existsByGameNumber(any()) } returns false

        val generator = GameRoomCodeGenerator(gameRepository)
        val roomNumber = generator.nextRoomNumber()

        assertTrue(roomNumber in 100_000..999_999, "Room number should be a six digit value")
        verify(exactly = 1) { gameRepository.existsByGameNumber(roomNumber) }
    }

    @Test
    fun `falls back to sequential allocation when random pool exhausted`() {
        every { gameRepository.existsByGameNumber(any()) } returns true
        every { gameRepository.findAllGameNumbers() } returns listOf(100_000, 100_001, 100_002)

        val generator = GameRoomCodeGenerator(gameRepository)
        val roomNumber = generator.nextRoomNumber()

        assertEquals(100_003, roomNumber)
        verify { gameRepository.findAllGameNumbers() }
    }
}
