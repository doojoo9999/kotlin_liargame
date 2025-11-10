package org.example.kotlin_liargame.domain.nemonemo.v2.service

import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleCreateRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleEntity
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.util.UUID

class PuzzleComplianceServiceTest {

    private val service = PuzzleComplianceService()

    @Test
    fun `flags adult content keywords`() {
        val puzzle = newPuzzle()
        val metadata = dummyMetadata(textScore = 0.1, tags = emptyList())
        val request = PuzzleCreateRequest(
            title = "NSFW Art",
            description = "adult themed",
            width = 5,
            height = 5,
            grid = listOf("#####"),
            tags = listOf("art"),
            seriesId = null,
            contentStyle = PuzzleContentStyle.GENERIC_PIXEL
        )
        val flags = service.assess(puzzle, metadata, request)
        assertTrue(flags.contains(PuzzleComplianceService.FLAG_POTENTIAL_ADULT))
    }

    @Test
    fun `flags text heavy puzzles`() {
        val puzzle = newPuzzle()
        val metadata = dummyMetadata(textScore = 0.9, tags = listOf("dense"))
        val request = PuzzleCreateRequest(
            title = "HELLO",
            description = null,
            width = 5,
            height = 5,
            grid = listOf("#####"),
            tags = emptyList(),
            seriesId = null,
            contentStyle = PuzzleContentStyle.GENERIC_PIXEL
        )
        val flags = service.assess(puzzle, metadata, request)
        assertTrue(flags.contains(PuzzleComplianceService.FLAG_TEXT_HEAVY))
        assertTrue(flags.contains(PuzzleComplianceService.FLAG_DENSE_PATTERN))
    }

    private fun newPuzzle(): PuzzleEntity = PuzzleEntity(
        title = "Test",
        description = null,
        width = 5,
        height = 5,
        authorId = UUID.randomUUID(),
        authorAnonId = null,
        status = org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus.DRAFT,
        contentStyle = PuzzleContentStyle.GENERIC_PIXEL
    )

    private fun dummyMetadata(textScore: Double, tags: List<String>): ResolvedPuzzleMetadata = ResolvedPuzzleMetadata(
        rowsJson = "[]",
        colsJson = "[]",
        solutionBytes = byteArrayOf(),
        checksum = "checksum",
        contentStyle = PuzzleContentStyle.GENERIC_PIXEL,
        textScore = textScore,
        tags = tags,
        unique = true,
        difficultyScore = 4.0,
        difficultyCategory = "MEDIUM",
        estimatedTimeMs = 1000
    )
}
