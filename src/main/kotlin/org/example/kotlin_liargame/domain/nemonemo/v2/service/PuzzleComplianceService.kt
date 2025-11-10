package org.example.kotlin_liargame.domain.nemonemo.v2.service

import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleCreateRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleEntity
import org.springframework.stereotype.Service

@Service
class PuzzleComplianceService {

    fun assess(
        puzzle: PuzzleEntity,
        metadata: ResolvedPuzzleMetadata,
        request: PuzzleCreateRequest
    ): Set<String> {
        val flags = mutableSetOf<String>()
        val title = request.title.lowercase()
        val description = request.description?.lowercase() ?: ""
        val combined = (title + " " + description + " " + request.tags.joinToString(" ")).lowercase()

        if (ADULT_KEYWORDS.any { combined.contains(it) }) {
            flags += FLAG_POTENTIAL_ADULT
        }
        if (COPYRIGHT_KEYWORDS.any { title.contains(it) }) {
            flags += FLAG_POTENTIAL_COPYRIGHT
        }
        if (metadata.textScore > 0.7) {
            flags += FLAG_TEXT_HEAVY
        }
        if (metadata.tags.contains("dense")) {
            flags += FLAG_DENSE_PATTERN
        }
        if (metadata.tags.contains("symmetrical")) {
            flags += FLAG_INTRICATE_PATTERN
        }
        return flags
    }

    companion object {
        const val FLAG_POTENTIAL_ADULT = "POTENTIAL_ADULT"
        const val FLAG_POTENTIAL_COPYRIGHT = "POTENTIAL_COPYRIGHT"
        const val FLAG_TEXT_HEAVY = "TEXT_HEAVY"
        const val FLAG_DENSE_PATTERN = "DENSE_PATTERN"
        const val FLAG_INTRICATE_PATTERN = "INTRICATE_PATTERN"

        private val ADULT_KEYWORDS = listOf("adult", "nsfw", "erotic", "18+")
        private val COPYRIGHT_KEYWORDS = listOf("mario", "pikachu", "zelda", "gundam")
    }
}
