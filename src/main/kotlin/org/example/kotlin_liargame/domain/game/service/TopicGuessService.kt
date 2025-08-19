package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.EnhancedLiarGuessStatus
import org.example.kotlin_liargame.domain.game.dto.LiarSpecificMessage
import org.example.kotlin_liargame.domain.game.dto.StatusMessage
import org.example.kotlin_liargame.domain.game.dto.response.*
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.TaskScheduler
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.locks.ReentrantLock
import kotlin.math.min

@Service
@Transactional
class TopicGuessService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val taskScheduler: TaskScheduler
) {
    
    private val liarGuessStatusMap = ConcurrentHashMap<Int, EnhancedLiarGuessStatus>()
    private val timerTasks = ConcurrentHashMap<Int, ScheduledFuture<*>>()
    private val gameLocks = ConcurrentHashMap<Int, ReentrantLock>()
    
    fun startLiarGuessPhase(gameNumber: Int, liarPlayerId: Long): LiarGuessStartResponse {
        try {
            val game = gameRepository.findByGameNumber(gameNumber)
                ?: throw IllegalArgumentException("Game not found: $gameNumber")
            val liarPlayer = playerRepository.findById(liarPlayerId)
                .orElseThrow { IllegalArgumentException("Liar player not found: $liarPlayerId") }
            
            val guessStatus = EnhancedLiarGuessStatus(
                liarPlayerId = liarPlayerId,
                guessTimeLimit = 30,
                startTime = Instant.now(),
                remainingTime = 30
            )
            liarGuessStatusMap[gameNumber] = guessStatus
            
            // Send different messages to liar and other players
            sendLiarSpecificMessage(gameNumber, liarPlayerId, "주제를 맞춰보세요! (30초)")
            sendOtherPlayersMessage(gameNumber, liarPlayerId, "라이어가 주제를 생각중입니다...")
            
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
            
            startEnhancedLiarGuessTimer(gameNumber)
            
            return response
        } catch (e: Exception) {
            throw RuntimeException("Failed to start liar guess phase for game $gameNumber", e)
        }
    }
    
    fun submitLiarGuess(gameNumber: Int, liarPlayerId: Long, guess: String): LiarGuessResultResponse {
        try {
            val guessStatus = liarGuessStatusMap[gameNumber]
                ?: throw IllegalStateException("No liar guess phase active for game $gameNumber")
            
            if (guessStatus.liarPlayerId != liarPlayerId) {
                throw IllegalArgumentException("Only the liar can submit a guess")
            }
            
            if (guessStatus.guessSubmitted) {
                throw IllegalStateException("Guess already submitted")
            }
            
            // Cancel the timer
            timerTasks[gameNumber]?.cancel(false)
            timerTasks.remove(gameNumber)
            
            val game = gameRepository.findByGameNumber(gameNumber)
                ?: throw IllegalArgumentException("Game not found: $gameNumber")
            
            val correctAnswer = game.citizenSubject?.content ?: ""
            
            // Enhanced answer validation
            val isCorrect = validateAnswer(guess, correctAnswer)
            
            guessStatus.guessSubmitted = true
            guessStatus.guessText = guess
            guessStatus.isCorrect = isCorrect
            
            val winner = if (isCorrect) "LIARS" else "CITIZENS"
            
            val response = LiarGuessResultResponse(
                gameNumber = gameNumber,
                liarGuess = guess,
                correctAnswer = correctAnswer,
                isCorrect = isCorrect,
                winner = winner
            )
            
            messagingTemplate.convertAndSend(
                "/topic/game/$gameNumber/liar-guess-result",
                response
            )
            
            return response
        } catch (e: Exception) {
            throw RuntimeException("Failed to submit liar guess for game $gameNumber", e)
        }
    }
    
    fun handleGuessTimeout(gameNumber: Int): Boolean {
        try {
            val guessStatus = liarGuessStatusMap[gameNumber] ?: return false
            
            if (!guessStatus.guessSubmitted) {
                guessStatus.guessSubmitted = true
                guessStatus.isCorrect = false
                guessStatus.timedOut = true
                
                val response = LiarGuessResultResponse(
                    gameNumber = gameNumber,
                    liarGuess = "",
                    correctAnswer = getCorrectAnswer(gameNumber),
                    isCorrect = false,
                    winner = "CITIZENS"
                )
                
                messagingTemplate.convertAndSend(
                    "/topic/game/$gameNumber/liar-guess-result",
                    response
                )
                
                sendModeratorMessage(gameNumber, "시간 초과! 라이어가 주제를 맞추지 못했습니다.")
                return true
            }
            return false
        } catch (e: Exception) {
            println("[ERROR] Failed to handle guess timeout for game $gameNumber: ${e.message}")
            return false
        }
    }
    
    fun getRemainingTime(gameNumber: Int): Int {
        val guessStatus = liarGuessStatusMap[gameNumber] ?: return 0
        val elapsed = java.time.Duration.between(guessStatus.startTime, Instant.now()).seconds
        return maxOf(0, guessStatus.guessTimeLimit - elapsed.toInt())
    }
    
    fun cleanupGuessStatus(gameNumber: Int) {
        liarGuessStatusMap.remove(gameNumber)
        timerTasks[gameNumber]?.cancel(false)
        timerTasks.remove(gameNumber)
    }
    
    private fun validateAnswer(guess: String, correctAnswer: String): Boolean {
        val normalizedGuess = normalizeText(guess)
        val normalizedAnswer = normalizeText(correctAnswer)
        
        if (normalizedGuess == normalizedAnswer) {
            return true
        }
        
        if (normalizedAnswer.contains(normalizedGuess) || normalizedGuess.contains(normalizedAnswer)) {
            return true
        }
        
        val editDistance = calculateEditDistance(normalizedGuess, normalizedAnswer)
        val maxLength = maxOf(normalizedGuess.length, normalizedAnswer.length)
        val similarity = 1.0 - (editDistance.toDouble() / maxLength)
        
        return similarity >= 0.7
    }
    
    private fun normalizeText(text: String): String {
        return text.trim()
            .lowercase()
            .replace(Regex("\\s+"), "") // Remove all whitespace
            .replace(Regex("[^가-힣a-z0-9]"), "") // Keep only Korean, English, numbers
    }
    
    private fun calculateEditDistance(s1: String, s2: String): Int {
        val dp = Array(s1.length + 1) { IntArray(s2.length + 1) }
        
        for (i in 0..s1.length) {
            dp[i][0] = i
        }
        for (j in 0..s2.length) {
            dp[0][j] = j
        }
        
        for (i in 1..s1.length) {
            for (j in 1..s2.length) {
                if (s1[i - 1] == s2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1]
                } else {
                    dp[i][j] = 1 + min(
                        min(dp[i - 1][j], dp[i][j - 1]),
                        dp[i - 1][j - 1]
                    )
                }
            }
        }
        
        return dp[s1.length][s2.length]
    }
    
    private fun startEnhancedLiarGuessTimer(gameNumber: Int) {
        val timerTask = taskScheduler.scheduleAtFixedRate({
            try {
                val guessStatus = liarGuessStatusMap[gameNumber]
                if (guessStatus != null && !guessStatus.guessSubmitted) {
                    val remainingTime = getRemainingTime(gameNumber)
                    guessStatus.remainingTime = remainingTime
                    
                    // Send countdown update
                    messagingTemplate.convertAndSend(
                        "/topic/game/$gameNumber/countdown",
                        CountdownUpdateResponse(
                            gameNumber = gameNumber,
                            remainingTime = remainingTime,
                            phase = "LIAR_GUESS"
                        )
                    )
                    
                    if (remainingTime <= 0) {
                        handleGuessTimeout(gameNumber)
                        timerTasks[gameNumber]?.cancel(false)
                        timerTasks.remove(gameNumber)
                    }
                }
            } catch (e: Exception) {
                println("[ERROR] Timer error for game $gameNumber: ${e.message}")
            }
        }, Instant.now().plusSeconds(1), java.time.Duration.ofSeconds(1))
        
        timerTasks[gameNumber] = timerTask
    }
    
    private fun sendLiarSpecificMessage(gameNumber: Int, liarPlayerId: Long, message: String) {
        messagingTemplate.convertAndSendToUser(
            liarPlayerId.toString(),
            "/topic/game/$gameNumber/liar-message",
            LiarSpecificMessage(
                content = message,
                timestamp = Instant.now(),
                showInput = true
            )
        )
    }
    
    private fun sendOtherPlayersMessage(gameNumber: Int, liarPlayerId: Long, message: String) {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return
        val players = playerRepository.findByGame(game)
        
        players.filter { it.id != liarPlayerId }.forEach { player ->
            messagingTemplate.convertAndSendToUser(
                player.id.toString(),
                "/topic/game/$gameNumber/status-message",
                StatusMessage(
                    content = message,
                    timestamp = Instant.now()
                )
            )
        }
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
    
    private fun getCorrectAnswer(gameNumber: Int): String {
        val game = gameRepository.findByGameNumber(gameNumber)
        return game?.citizenSubject?.content ?: ""
    }
}






