package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.global.config.GameProperties
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class TurnTimeoutService(
    private val gameRepository: GameRepository,
    private val gameProgressService: GameProgressService,
    private val gameProperties: GameProperties
) {

    @Scheduled(fixedRate = 10000) // Check every 10 seconds
    @Transactional
    fun checkTurnTimeouts() {
        val inProgressGames = gameRepository.findByGameState(org.example.kotlin_liargame.domain.game.model.enum.GameState.IN_PROGRESS)

        inProgressGames.forEach { game ->
            val turnStartedAt = game.turnStartedAt
            if (turnStartedAt != null) {
                val now = Instant.now()
                if (now.isAfter(turnStartedAt.plusSeconds(gameProperties.turnTimeoutSeconds))) {
                    println("[TIMEOUT] Turn timeout detected for game: ${game.gameNumber}, player: ${game.currentPlayerId}")
                    gameProgressService.forceNextTurn(game.id)
                }
            }
        }
    }
}