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

    @Scheduled(fixedRate = 5000) // Check every 5 seconds for better responsiveness
    @Transactional
    fun checkTurnTimeouts() {
        val inProgressGames = gameRepository.findByGameState(org.example.kotlin_liargame.domain.game.model.enum.GameState.IN_PROGRESS)
        
        inProgressGames.forEach { game ->
            val phaseEndTime = game.phaseEndTime
            if (phaseEndTime != null && game.currentPhase == org.example.kotlin_liargame.domain.game.model.enum.GamePhase.SPEECH) {
                val now = Instant.now()
                if (now.isAfter(phaseEndTime)) {
                    println("[TIMEOUT] Turn timeout detected for game: ${game.gameNumber}, player: ${game.currentPlayerId}, phaseEndTime: $phaseEndTime, currentTime: $now")
                    try {
                        gameProgressService.forceNextTurn(game.id)
                        println("[TIMEOUT] Successfully forced next turn for game: ${game.gameNumber}")
                    } catch (e: Exception) {
                        println("[TIMEOUT] Error forcing next turn for game: ${game.gameNumber}, error: ${e.message}")
                        e.printStackTrace()
                    }
                } else {
                    val remainingSeconds = java.time.Duration.between(now, phaseEndTime).seconds
                    if (remainingSeconds <= 10) {
                        println("[TIMEOUT] Game ${game.gameNumber} timeout in ${remainingSeconds} seconds")
                    }
                }
            }
        }
    }
}