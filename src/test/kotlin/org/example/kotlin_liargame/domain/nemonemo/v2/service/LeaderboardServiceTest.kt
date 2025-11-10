package org.example.kotlin_liargame.domain.nemonemo.v2.service

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.LeaderboardEntryDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.LeaderboardWindow
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreId
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.ScoreRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

class LeaderboardServiceTest {

    private val scoreRepository: ScoreRepository = mockk()
    private val leaderboardCacheService: LeaderboardCacheService = mockk()

    private val service = LeaderboardService(
        scoreRepository = scoreRepository,
        leaderboardCacheService = leaderboardCacheService
    )

    @Test
    fun `fetchLeaderboard uses cache entries when available`() {
        val cached = listOf(
            LeaderboardEntryDto(
                rank = 1,
                subjectKey = UUID.randomUUID(),
                nickname = "User",
                score = 5000,
                timeMs = null,
                combo = 0,
                perfect = true,
                mode = PuzzleMode.NORMAL,
                updatedAt = Instant.now()
            )
        )
        every {
            leaderboardCacheService.fetchEntries(LeaderboardWindow.GLOBAL, PuzzleMode.NORMAL, any(), any())
        } returns cached

        val response = service.fetchLeaderboard(LeaderboardWindow.GLOBAL, PuzzleMode.NORMAL, 10)

        assertEquals(1, response.entries.size)
        assertEquals(cached[0].subjectKey, response.entries.first().subjectKey)
        verify(exactly = 0) { scoreRepository.findAll() }
    }

    @Test
    fun `fetchLeaderboard falls back to score repository when cache empty`() {
        val subjectA = UUID.randomUUID()
        val subjectB = UUID.randomUUID()
        val scoreA = ScoreEntity(ScoreId(UUID.randomUUID(), subjectA, PuzzleMode.NORMAL)).apply {
            bestScore = 1200
        }
        val scoreB = ScoreEntity(ScoreId(UUID.randomUUID(), subjectA, PuzzleMode.NORMAL)).apply {
            bestScore = 800
        }
        val scoreC = ScoreEntity(ScoreId(UUID.randomUUID(), subjectB, PuzzleMode.NORMAL)).apply {
            bestScore = 1500
        }
        every { leaderboardCacheService.fetchEntries(any(), any(), any(), any()) } returns emptyList()
        every { scoreRepository.findAll() } returns listOf(scoreA, scoreB, scoreC)

        val response = service.fetchLeaderboard(LeaderboardWindow.GLOBAL, PuzzleMode.NORMAL, 5)

        assertEquals(2, response.entries.size)
        assertEquals(subjectA, response.entries.first().subjectKey)
        assertEquals(subjectB, response.entries[1].subjectKey)
        assertTrue(response.entries.first().score >= response.entries.last().score)
    }
}
