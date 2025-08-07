package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.response.*
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.TaskScheduler
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

@Service  
@Transactional
class GameResultService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val taskScheduler: TaskScheduler
) {
    private val liarGuessStatusMap = ConcurrentHashMap<Int, LiarGuessStatus>()
    
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
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        val liarPlayer = playerRepository.findById(liarPlayerId)
            .orElseThrow { IllegalArgumentException("Liar player not found") }
        
        val guessStatus = LiarGuessStatus(
            liarPlayerId = liarPlayerId,
            guessTimeLimit = 30,
            startTime = Instant.now()
        )
        liarGuessStatusMap[gameNumber] = guessStatus
        
        sendModeratorMessage(gameNumber, "라이어님, 주제를 맞춰보세요!")
        
        val citizenSubject = game.citizenSubject?.content ?: "Unknown"
        val response = LiarGuessStartResponse(
            gameNumber = gameNumber,
            liarPlayer = PlayerResultInfo.from(liarPlayer),
            citizenSubject = citizenSubject
        )
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/liar-guess-start",
            response
        )
        
        startLiarGuessTimer(gameNumber)
        
        return response
    }
    
    fun submitLiarGuess(gameNumber: Int, liarPlayerId: Long, guess: String): LiarGuessResultResponse {
        val guessStatus = liarGuessStatusMap[gameNumber]
            ?: throw IllegalStateException("No liar guess phase active")
        
        if (guessStatus.liarPlayerId != liarPlayerId) {
            throw IllegalArgumentException("Only the liar can submit a guess")
        }
        
        if (guessStatus.guessSubmitted) {
            throw IllegalStateException("Guess already submitted")
        }
        
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        
        val correctAnswer = game.citizenSubject?.content ?: ""
        
        val normalizedGuess = guess.trim().lowercase()
        val normalizedAnswer = correctAnswer.trim().lowercase()
        val isCorrect = normalizedGuess == normalizedAnswer
        
        guessStatus.guessSubmitted = true
        guessStatus.guessText = guess
        
        val winner = if (isCorrect) "LIARS" else "CITIZENS"
        
        val response = LiarGuessResultResponse(
            gameNumber = gameNumber,
            liarGuess = guess,
            correctAnswer = correctAnswer,
            isCorrect = isCorrect,
            winner = winner
        )
        
        if (isCorrect) {
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
        
        liarGuessStatusMap.remove(gameNumber)
        
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
        
        liarGuessStatusMap.remove(gameNumber)
        
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
    
    private fun startLiarGuessTimer(gameNumber: Int) {
        taskScheduler.schedule({
            val guessStatus = liarGuessStatusMap[gameNumber]
            if (guessStatus != null && !guessStatus.guessSubmitted) {
                endGameWithCitizenVictory(gameNumber)
            }
        }, Instant.now().plusSeconds(30))
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