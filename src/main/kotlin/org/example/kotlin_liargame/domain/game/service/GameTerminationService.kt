package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.response.GameTerminationMessage
import org.example.kotlin_liargame.domain.game.dto.response.GameTerminationResponse
import org.example.kotlin_liargame.domain.game.model.enum.AbnormalCondition
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.springframework.context.annotation.Lazy
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.TaskScheduler
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ScheduledFuture

@Service
@Transactional
class GameTerminationService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    @Lazy private val messagingTemplate: SimpMessagingTemplate,
    private val taskScheduler: TaskScheduler
) {
    
    private val gameMonitoringTasks = ConcurrentHashMap<Int, ScheduledFuture<*>>()
    private val terminationReasons = ConcurrentHashMap<Int, String>()

    fun forceTerminateGame(gameNumber: Int, adminReason: String): GameTerminationResponse {
        return try {
            val game = gameRepository.findByGameNumber(gameNumber)
                ?: throw IllegalArgumentException("Game not found: $gameNumber")
            
            if (game.gameState == GameState.ENDED) {
                throw IllegalStateException("Game is already ended")
            }
            
            // Record termination reason
            terminationReasons[gameNumber] = "Admin termination: $adminReason"
            
            // Terminate the game
            terminateGameInternal(gameNumber, "관리자에 의해 게임이 강제 종료되었습니다: $adminReason")
            
            GameTerminationResponse(
                gameNumber = gameNumber,
                terminationType = "ADMIN_FORCE",
                reason = adminReason,
                timestamp = Instant.now(),
                success = true
            )
        } catch (e: Exception) {
            println("[ERROR] Failed to force terminate game $gameNumber: ${e.message}")
            GameTerminationResponse(
                gameNumber = gameNumber,
                terminationType = "ADMIN_FORCE",
                reason = "Termination failed: ${e.message}",
                timestamp = Instant.now(),
                success = false
            )
        }
    }
    

    fun autoTerminateGame(gameNumber: Int, condition: AbnormalCondition): GameTerminationResponse {
        return try {
            val reason = when (condition) {
                AbnormalCondition.ALL_PLAYERS_DISCONNECTED -> "모든 플레이어가 연결을 끊었습니다"
                AbnormalCondition.GAME_STUCK -> "게임이 비정상적으로 중단되었습니다"
                AbnormalCondition.SERVER_ERROR -> "서버 오류로 인한 게임 종료"
                AbnormalCondition.TIMEOUT_EXCEEDED -> "게임 시간 초과"
            }
            
            terminationReasons[gameNumber] = "Auto termination: $reason"
            terminateGameInternal(gameNumber, reason)
            
            GameTerminationResponse(
                gameNumber = gameNumber,
                terminationType = "AUTO",
                reason = reason,
                timestamp = Instant.now(),
                success = true
            )
        } catch (e: Exception) {
            println("[ERROR] Failed to auto terminate game $gameNumber: ${e.message}")
            GameTerminationResponse(
                gameNumber = gameNumber,
                terminationType = "AUTO",
                reason = "Auto termination failed: ${e.message}",
                timestamp = Instant.now(),
                success = false
            )
        }
    }

    fun startGameMonitoring(gameNumber: Int) {
        try {
            // Cancel existing monitoring if any
            stopGameMonitoring(gameNumber)
            
            val monitoringTask = taskScheduler.scheduleAtFixedRate({
                checkGameHealth(gameNumber)
            }, Instant.now().plusSeconds(30), java.time.Duration.ofSeconds(30))
            
            gameMonitoringTasks[gameNumber] = monitoringTask
            println("[MONITORING] Started monitoring game $gameNumber")
        } catch (e: Exception) {
            println("[ERROR] Failed to start monitoring for game $gameNumber: ${e.message}")
        }
    }

    fun stopGameMonitoring(gameNumber: Int) {
        gameMonitoringTasks[gameNumber]?.let { task ->
            task.cancel(false)
            gameMonitoringTasks.remove(gameNumber)
            println("[MONITORING] Stopped monitoring game $gameNumber")
        }
    }

    private fun checkGameHealth(gameNumber: Int) {
        try {
            val game = gameRepository.findByGameNumber(gameNumber)
            if (game == null || game.gameState == GameState.ENDED) {
                stopGameMonitoring(gameNumber)
                return
            }
            
            val players = playerRepository.findByGame(game)
            val alivePlayers = players.filter { it.isAlive }
            
            when {
                alivePlayers.isEmpty() -> {
                    autoTerminateGame(gameNumber, AbnormalCondition.ALL_PLAYERS_DISCONNECTED)
                }
                isGameStuck(gameNumber) -> {
                    autoTerminateGame(gameNumber, AbnormalCondition.GAME_STUCK)
                }
                isGameTimeoutExceeded(game) -> {
                    autoTerminateGame(gameNumber, AbnormalCondition.TIMEOUT_EXCEEDED)
                }
            }
        } catch (e: Exception) {
            println("[ERROR] Game health check failed for game $gameNumber: ${e.message}")
        }
    }

    private fun terminateGameInternal(gameNumber: Int, message: String) {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found: $gameNumber")
        
        // Update game state
        game.gameState = GameState.ENDED
        gameRepository.save(game)
        
        // Notify all players
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/termination",
            GameTerminationMessage(
                gameNumber = gameNumber,
                message = message,
                timestamp = Instant.now(),
                reason = terminationReasons[gameNumber] ?: "Unknown"
            )
        )
        
        // Cleanup resources
        cleanupGameResources(game)
        
        println("[TERMINATION] Game $gameNumber terminated: $message")
    }

    private fun cleanupGameResources(game: org.example.kotlin_liargame.domain.game.model.GameEntity) {
        try {
            // Stop monitoring
            stopGameMonitoring(game.gameNumber)
            
            // Remove termination reason
            terminationReasons.remove(game.gameNumber)
            
            // Additional cleanup can be added here for other services
            // e.g., voting cleanup, defense cleanup, etc.
            
            println("[CLEANUP] Cleaned up resources for game ${game.gameNumber}")
        } catch (e: Exception) {
            println("[ERROR] Failed to cleanup resources for game ${game.gameNumber}: ${e.message}")
        }
    }

    private fun isGameStuck(gameNumber: Int): Boolean {
        // Implementation would check last activity timestamp
        // For now, return false - can be enhanced based on requirements
        return false
    }

    private fun isGameTimeoutExceeded(game: org.example.kotlin_liargame.domain.game.model.GameEntity): Boolean {
        val maxGameDurationHours = 2L
        val gameStartTime = game.createdAt
        val now = Instant.now()
        val duration = java.time.Duration.between(gameStartTime, now)
        
        return duration.toHours() > maxGameDurationHours
    }

    fun getTerminationStats(): Map<String, Any> {
        return mapOf(
            "activeMonitoringGames" to gameMonitoringTasks.size,
            "totalTerminations" to terminationReasons.size,
            "timestamp" to Instant.now()
        )
    }
}
