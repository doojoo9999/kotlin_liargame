package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.springframework.context.annotation.Lazy
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class TurnTimeoutService(
    private val gameRepository: GameRepository,
    private val gameProgressService: GameProgressService,
    private val votingService: VotingService,
    @Lazy private val defenseService: DefenseService,
    private val topicGuessService: TopicGuessService
) {

    @Scheduled(fixedRate = 1000) // Check every 1 second for better responsiveness
    @Transactional
    fun checkTurnTimeouts() {
        val inProgressGames = gameRepository.findByGameState(org.example.kotlin_liargame.domain.game.model.enum.GameState.IN_PROGRESS)
        
        inProgressGames.forEach { game ->
            val phaseEndTime = game.phaseEndTime
            if (phaseEndTime != null) {
                val now = Instant.now()
                if (now.isAfter(phaseEndTime)) {
                    when (game.currentPhase) {
                        GamePhase.SPEECH -> {
                            println("[TIMEOUT] Turn timeout detected for game: ${game.gameNumber}, player: ${game.currentPlayerId}, phaseEndTime: $phaseEndTime, currentTime: $now")
                            try {
                                gameProgressService.forceNextTurn(game.id)
                                println("[TIMEOUT] Successfully forced next turn for game: ${game.gameNumber}")
                            } catch (e: Exception) {
                                println("[TIMEOUT] Error forcing next turn for game: ${game.gameNumber}, error: ${e.message}")
                                e.printStackTrace()
                            }
                        }
                        GamePhase.VOTING_FOR_LIAR -> {
                            println("[TIMEOUT] Voting timeout detected for game: ${game.gameNumber}, phaseEndTime: $phaseEndTime, currentTime: $now")
                            try {
                                votingService.forceVotingPhaseEnd(game.gameNumber)
                                println("[TIMEOUT] Successfully forced voting phase end for game: ${game.gameNumber}")
                            } catch (e: Exception) {
                                println("[TIMEOUT] Error forcing voting phase end for game: ${game.gameNumber}, error: ${e.message}")
                                e.printStackTrace()
                            }
                        }
                        GamePhase.DEFENDING -> {
                            println("[TIMEOUT] Defense timeout detected for game: ${game.gameNumber}")
                            runCatching { defenseService.handleDefenseTimeout(game.gameNumber) }
                                .onFailure { ex ->
                                    println("[TIMEOUT] Error handling defense timeout for game: ${game.gameNumber}, error: ${ex.message}")
                                    ex.printStackTrace()
                                }
                        }
                        GamePhase.VOTING_FOR_SURVIVAL -> {
                            println("[TIMEOUT] Final voting timeout detected for game: ${game.gameNumber}")
                            runCatching { defenseService.handleFinalVotingTimeout(game.gameNumber) }
                                .onFailure { ex ->
                                    println("[TIMEOUT] Error handling final voting timeout for game: ${game.gameNumber}, error: ${ex.message}")
                                    ex.printStackTrace()
                                }
                        }
                        GamePhase.GUESSING_WORD -> {
                            println("[TIMEOUT] Liar guess timeout detected for game: ${game.gameNumber}")
                            runCatching {
                                val handled = topicGuessService.handleGuessTimeout(game.gameNumber)
                                if (!handled) {
                                    println("[TIMEOUT] Liar guess timeout skipped for game: ${game.gameNumber} (already resolved)")
                                }
                            }.onFailure { ex ->
                                println("[TIMEOUT] Error handling liar guess timeout for game: ${game.gameNumber}, error: ${ex.message}")
                                ex.printStackTrace()
                            }
                        }
                        else -> {
                            println("[TIMEOUT] Timeout detected for unsupported phase: ${game.currentPhase} in game: ${game.gameNumber}")
                        }
                    }
                } else {
                    val remainingSeconds = java.time.Duration.between(now, phaseEndTime).seconds
                    if (remainingSeconds <= 10) {
                        println("[TIMEOUT] Game ${game.gameNumber} ${game.currentPhase} timeout in ${remainingSeconds} seconds")
                    }
                }
            }
        }
    }
}
