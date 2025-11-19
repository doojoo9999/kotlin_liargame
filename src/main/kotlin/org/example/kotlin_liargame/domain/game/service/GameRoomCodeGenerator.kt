package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.security.SecureRandom
import java.util.concurrent.atomic.AtomicInteger

@Component
class GameRoomCodeGenerator(
    private val gameRepository: GameRepository
) {
    private val logger = LoggerFactory.getLogger(this::class.java)
    private val random = SecureRandom()
    private val fallbackSequence = AtomicInteger(100_000)

    fun nextRoomNumber(): Int {
        repeat(MAX_RANDOM_ATTEMPTS) {
            val candidate = START_RANGE + random.nextInt(RANDOM_SPAN)
            if (!gameRepository.existsByGameNumber(candidate)) {
                logger.debug("Generated random game room number {}", candidate)
                return candidate
            }
        }

        val maxExisting = gameRepository.findAllGameNumbers().maxOrNull() ?: fallbackSequence.get()
        val fallbackValue = fallbackSequence.updateAndGet { previous ->
            val baseline = maxExisting.coerceAtLeast(previous)
            baseline + 1
        }

        logger.warn("Random generation failed, falling back to sequential room number {}", fallbackValue)
        return fallbackValue
    }

    private companion object {
        private const val START_RANGE = 100_000
        private const val RANDOM_SPAN = 900_000
        private const val MAX_RANDOM_ATTEMPTS = 50
    }
}
