package org.example.kotlin_liargame.domain.game.controller

import org.example.kotlin_liargame.domain.game.service.AbnormalCondition
import org.example.kotlin_liargame.domain.game.service.GameTerminationService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = ["http://localhost:3000"])
class AdminController(
    private val gameTerminationService: GameTerminationService
) {
    
    /**
     * Force terminate a game (Admin only)
     */
    @PostMapping("/games/{gameNumber}/terminate")
    fun forceTerminateGame(
        @PathVariable gameNumber: Int,
        @RequestBody request: AdminTerminationRequest
    ): ResponseEntity<*> {
        return try {
            // TODO: Add admin authentication check here
            // For now, allowing any request for testing purposes
            
            val response = gameTerminationService.forceTerminateGame(gameNumber, request.reason)
            
            if (response.success) {
                ResponseEntity.ok(response)
            } else {
                ResponseEntity.badRequest().body(response)
            }
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(
                mapOf(
                    "error" to "Failed to terminate game",
                    "message" to e.message,
                    "gameNumber" to gameNumber
                )
            )
        }
    }
    
    /**
     * Start monitoring a game for abnormal conditions
     */
    @PostMapping("/games/{gameNumber}/monitor")
    fun startGameMonitoring(@PathVariable gameNumber: Int): ResponseEntity<*> {
        return try {
            gameTerminationService.startGameMonitoring(gameNumber)
            ResponseEntity.ok(
                mapOf(
                    "message" to "Game monitoring started",
                    "gameNumber" to gameNumber
                )
            )
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(
                mapOf(
                    "error" to "Failed to start monitoring",
                    "message" to e.message,
                    "gameNumber" to gameNumber
                )
            )
        }
    }
    
    /**
     * Stop monitoring a game
     */
    @DeleteMapping("/games/{gameNumber}/monitor")
    fun stopGameMonitoring(@PathVariable gameNumber: Int): ResponseEntity<*> {
        return try {
            gameTerminationService.stopGameMonitoring(gameNumber)
            ResponseEntity.ok(
                mapOf(
                    "message" to "Game monitoring stopped",
                    "gameNumber" to gameNumber
                )
            )
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(
                mapOf(
                    "error" to "Failed to stop monitoring",
                    "message" to e.message,
                    "gameNumber" to gameNumber
                )
            )
        }
    }
    
    /**
     * Manually trigger auto-termination for testing
     */
    @PostMapping("/games/{gameNumber}/auto-terminate")
    fun triggerAutoTermination(
        @PathVariable gameNumber: Int,
        @RequestBody request: AutoTerminationRequest
    ): ResponseEntity<*> {
        return try {
            val condition = when (request.condition.uppercase()) {
                "ALL_PLAYERS_DISCONNECTED" -> AbnormalCondition.ALL_PLAYERS_DISCONNECTED
                "GAME_STUCK" -> AbnormalCondition.GAME_STUCK
                "SERVER_ERROR" -> AbnormalCondition.SERVER_ERROR
                "TIMEOUT_EXCEEDED" -> AbnormalCondition.TIMEOUT_EXCEEDED
                else -> throw IllegalArgumentException("Invalid condition: ${request.condition}")
            }
            
            val response = gameTerminationService.autoTerminateGame(gameNumber, condition)
            
            if (response.success) {
                ResponseEntity.ok(response)
            } else {
                ResponseEntity.badRequest().body(response)
            }
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(
                mapOf(
                    "error" to "Failed to auto-terminate game",
                    "message" to e.message,
                    "gameNumber" to gameNumber
                )
            )
        }
    }
    
    /**
     * Get termination statistics
     */
    @GetMapping("/termination/stats")
    fun getTerminationStats(): ResponseEntity<*> {
        return try {
            val stats = gameTerminationService.getTerminationStats()
            ResponseEntity.ok(stats)
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(
                mapOf(
                    "error" to "Failed to get termination stats",
                    "message" to e.message
                )
            )
        }
    }
    
    /**
     * Health check endpoint for admin functionality
     */
    @GetMapping("/health")
    fun healthCheck(): ResponseEntity<*> {
        return ResponseEntity.ok(
            mapOf(
                "status" to "OK",
                "service" to "Admin Controller",
                "timestamp" to java.time.Instant.now()
            )
        )
    }
}

/**
 * Request body for admin game termination
 */
data class AdminTerminationRequest(
    val reason: String,
    val adminId: String? = null // Optional admin identifier
)

/**
 * Request body for auto-termination testing
 */
data class AutoTerminationRequest(
    val condition: String // One of: ALL_PLAYERS_DISCONNECTED, GAME_STUCK, SERVER_ERROR, TIMEOUT_EXCEEDED
)