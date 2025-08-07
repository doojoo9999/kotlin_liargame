package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.response.*
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.springframework.context.annotation.Lazy
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.TaskScheduler
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service  
@Transactional
class GameResultService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val taskScheduler: TaskScheduler,
    @Lazy private val topicGuessService: TopicGuessService
) {
    
    fun processGameResult(gameNumber: Int, judgmentResult: FinalJudgmentResultResponse) {
        when {
            judgmentResult.isKilled && judgmentResult.isLiar -> {
                endGameWithCitizenVictory(gameNumber)
            }
            judgmentResult.isKilled && !judgmentResult.isLiar -> {
                val liarPlayer = findLiarInGame(gameNumber)
                startLiarGuessPhase(gameNumber, liarPlayer.id)
            }
            !judgmentResult.isKilled -> {
                val endCondition = checkGameEndConditions(gameNumber)
                when (endCondition) {
                    GameEndCondition.LIAR_VICTORY -> endGameWithLiarVictory(gameNumber)
                    GameEndCondition.NEXT_ROUND -> startNextRound(gameNumber)
                    else -> endGameWithCitizenVictory(gameNumber)
                }
            }
        }
    }
    
    fun startLiarGuessPhase(gameNumber: Int, liarPlayerId: Long): LiarGuessStartResponse {
        return topicGuessService.startLiarGuessPhase(gameNumber, liarPlayerId)
    }
    
    fun submitLiarGuess(gameNumber: Int, liarPlayerId: Long, guess: String): LiarGuessResultResponse {
        val response = topicGuessService.submitLiarGuess(gameNumber, liarPlayerId, guess)
        
        // Handle game ending based on the result
        if (response.isCorrect) {
            endGameWithLiarVictory(gameNumber)
        } else {
            endGameWithCitizenVictory(gameNumber)
        }
        
        return response
    }
    
    fun endGameWithCitizenVictory(gameNumber: Int): GameEndResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        val players = playerRepository.findByGame(game)
        
        game.endGame()
        gameRepository.save(game)
        
        sendModeratorMessage(gameNumber, "시민팀이 승리했습니다!")
        
        val citizens = players.filter { it.role.name == "CITIZEN" }
        val liars = players.filter { it.role.name == "LIAR" }
        
        val response = GameEndResponse(
            gameNumber = gameNumber,
            winner = "CITIZENS",
            citizens = citizens.map { PlayerResultInfo.from(it) },
            liars = liars.map { PlayerResultInfo.from(it) },
            citizenSubject = game.citizenSubject?.content,
            liarSubject = game.liarSubject?.content,
            gameStatistics = calculateGameStatistics(gameNumber)
        )
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/game-end",
            response
        )
        
        topicGuessService.cleanupGuessStatus(gameNumber)
        
        return response
    }
    
    fun endGameWithLiarVictory(gameNumber: Int): GameEndResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        val players = playerRepository.findByGame(game)
        
        game.endGame()
        gameRepository.save(game)
        
        sendModeratorMessage(gameNumber, "라이어팀이 승리했습니다!")
        
        val citizens = players.filter { it.role.name == "CITIZEN" }
        val liars = players.filter { it.role.name == "LIAR" }
        
        val response = GameEndResponse(
            gameNumber = gameNumber,
            winner = "LIARS",
            citizens = citizens.map { PlayerResultInfo.from(it) },
            liars = liars.map { PlayerResultInfo.from(it) },
            citizenSubject = game.citizenSubject?.content,
            liarSubject = game.liarSubject?.content,
            gameStatistics = calculateGameStatistics(gameNumber)
        )
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/game-end",
            response
        )
        
        topicGuessService.cleanupGuessStatus(gameNumber)
        
        return response
    }
    
    fun startNextRound(gameNumber: Int): NextRoundResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        
        val success = game.nextRound()
        if (!success) {
            endGameWithLiarVictory(gameNumber)
            throw IllegalStateException("Cannot proceed to next round")
        }
        
        gameRepository.save(game)
        
        val players = playerRepository.findByGame(game)
        players.forEach { player ->
            player.resetForNewRound()
        }
        playerRepository.saveAll(players)
        
        val response = NextRoundResponse(
            gameNumber = gameNumber,
            currentRound = game.gameCurrentRound,
            totalRounds = game.gameTotalRounds,
            message = "라운드 ${game.gameCurrentRound}가 시작됩니다!"
        )
        
        sendModeratorMessage(gameNumber, response.message)
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/next-round",
            response
        )
        
        return response
    }
    
    private fun checkGameEndConditions(gameNumber: Int): GameEndCondition {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return GameEndCondition.CITIZEN_VICTORY
        val players = playerRepository.findByGame(game)
        
        val aliveLiars = players.filter { it.role.name == "LIAR" && it.isAlive }
        val aliveCitizens = players.filter { it.role.name == "CITIZEN" && it.isAlive }
        
        return when {
            aliveLiars.isEmpty() -> GameEndCondition.CITIZEN_VICTORY
            aliveCitizens.size <= aliveLiars.size -> GameEndCondition.LIAR_VICTORY
            game.gameCurrentRound >= game.gameTotalRounds -> GameEndCondition.LIAR_VICTORY  
            else -> GameEndCondition.NEXT_ROUND
        }
    }
    
    
    private fun calculateGameStatistics(gameNumber: Int): GameStatistics {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        
        val totalDuration = if (game.gameEndTime != null && game.createdAt != null) {
            java.time.Duration.between(game.createdAt, game.gameEndTime).seconds
        } else 0L
        
        return GameStatistics(
            totalRounds = game.gameTotalRounds,
            currentRound = game.gameCurrentRound,
            totalDuration = totalDuration,
            averageRoundDuration = if (game.gameCurrentRound > 0) totalDuration / game.gameCurrentRound else 0L,
            totalVotes = 0, // 실제 구현에서는 투표 수 계산 필요
            correctGuesses = 0 // 실제 구현에서는 정답 추측 수 계산 필요
        )
    }
    
    private fun findLiarInGame(gameNumber: Int): org.example.kotlin_liargame.domain.game.model.PlayerEntity {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        val players = playerRepository.findByGame(game)
        
        return players.firstOrNull { it.role.name == "LIAR" && it.isAlive }
            ?: throw IllegalStateException("No alive liar found in game")
    }
    
    private fun sendModeratorMessage(gameNumber: Int, message: String) {
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/moderator",
            ModeratorMessage(
                content = message,
                timestamp = Instant.now()
            )
        )
    }
}