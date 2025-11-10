package org.example.kotlin_liargame.domain.nemonemo.v2.service

import io.mockk.every
import io.mockk.mockk
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleSummaryDto
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreId
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.ScoreRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.data.domain.PageRequest
import java.time.Instant
import java.util.UUID

class PersonalizedRecommendationServiceTest {

    private val scoreRepository: ScoreRepository = mockk()
    private val puzzleRepository: PuzzleRepository = mockk()
    private val service = PersonalizedRecommendationService(scoreRepository, puzzleRepository)

    @Test
    fun `recommendations favor puzzles matching history`() {
        val subject = UUID.randomUUID()
        val historyPuzzle = puzzle("History", 4.5, tags = setOf("animal"))
        val historyScore = ScoreEntity(ScoreId(historyPuzzle.id, subject, org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode.NORMAL))
        every { scoreRepository.findByIdSubjectKey(subject, any()) } returns listOf(historyScore)
        every { puzzleRepository.findAllById(any()) } returns listOf(historyPuzzle)
        val preferred = puzzle("Preferred", 4.6, tags = setOf("animal"))
        val other = puzzle("Other", 8.0, tags = setOf("abstract"))
        every { puzzleRepository.findTop300ByStatusInOrderByCreatedAtDesc(any()) } returns listOf(preferred, other)

        val results = service.getRecommendations(subject, 3)

        assertEquals(listOf(preferred.id, other.id), results.map(PuzzleSummaryDto::id))
    }

    @Test
    fun `falls back when no history`() {
        val subject = UUID.randomUUID()
        every { scoreRepository.findByIdSubjectKey(subject, any()) } returns emptyList()
        every { puzzleRepository.findAllById(any()) } returns emptyList()
        val candidate = puzzle("Fallback", 3.0)
        every { puzzleRepository.findTop300ByStatusInOrderByCreatedAtDesc(any()) } returns listOf(candidate)

        val results = service.getRecommendations(subject, 3)

        assertEquals(candidate.id, results.first().id)
    }

    private fun puzzle(
        title: String,
        difficulty: Double,
        tags: Set<String> = setOf("tag")
    ): PuzzleEntity = PuzzleEntity(
        title = title,
        description = null,
        width = 5,
        height = 5,
        authorId = UUID.randomUUID(),
        authorAnonId = null,
        status = PuzzleStatus.APPROVED,
        contentStyle = PuzzleContentStyle.GENERIC_PIXEL
    ).apply {
        difficultyScore = difficulty
        this.tags.addAll(tags)
        playCount = 100
        clearCount = 60
        averageRating = 4.2
    }
}
