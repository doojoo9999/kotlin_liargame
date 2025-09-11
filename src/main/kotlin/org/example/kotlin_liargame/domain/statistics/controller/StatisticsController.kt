package org.example.kotlin_liargame.domain.statistics.controller

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.statistics.service.GameStatisticsService
import org.example.kotlin_liargame.global.dto.ErrorResponse
import org.example.kotlin_liargame.global.security.SessionManagementService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/statistics")
class StatisticsController(
    private val gameStatisticsService: GameStatisticsService,
    private val sessionManagementService: SessionManagementService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    @GetMapping("/global")
    fun getGlobalStatistics(): ResponseEntity<Any> {
        logger.debug("Global statistics requested")
        
        return try {
            val statistics = gameStatisticsService.getGlobalStatistics()
            ResponseEntity.ok(statistics)
        } catch (e: Exception) {
            logger.error("Failed to get global statistics", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "STATISTICS_ERROR",
                    message = "Failed to retrieve global statistics",
                    userFriendlyMessage = "통계를 불러오는 중 오류가 발생했습니다."
                ))
        }
    }

    @GetMapping("/player/{userId}")
    fun getPlayerStatistics(
        @PathVariable userId: Long,
        session: HttpSession
    ): ResponseEntity<Any> {
        logger.debug("Player statistics requested for user: {}", userId)
        
        // Check if user is requesting their own stats or is admin
        val currentUserId = sessionManagementService.getCurrentUserId(session)
        val isAdmin = sessionManagementService.isAdmin(session)
        
        if (currentUserId != userId && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse(
                    errorCode = "ACCESS_DENIED",
                    message = "Access denied to player statistics",
                    userFriendlyMessage = "다른 플레이어의 통계에 접근할 수 없습니다."
                ))
        }
        
        return try {
            val statistics = gameStatisticsService.getPlayerStatistics(userId)
            ResponseEntity.ok(statistics)
        } catch (e: IllegalArgumentException) {
            logger.debug("Player not found: {}", userId)
            ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse(
                    errorCode = "PLAYER_NOT_FOUND",
                    message = "Player not found",
                    userFriendlyMessage = "플레이어를 찾을 수 없습니다."
                ))
        } catch (e: Exception) {
            logger.error("Failed to get player statistics for user: {}", userId, e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "STATISTICS_ERROR",
                    message = "Failed to retrieve player statistics",
                    userFriendlyMessage = "플레이어 통계를 불러오는 중 오류가 발생했습니다."
                ))
        }
    }

    @GetMapping("/player/current")
    fun getCurrentPlayerStatistics(session: HttpSession): ResponseEntity<Any> {
        logger.debug("Current player statistics requested")
        
        val currentUserId = sessionManagementService.getCurrentUserId(session)
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(
                    errorCode = "NOT_AUTHENTICATED",
                    message = "User not authenticated",
                    userFriendlyMessage = "로그인이 필요합니다."
                ))
        }
        
        return getPlayerStatistics(currentUserId, session)
    }

    @GetMapping("/trends")
    fun getGameTrends(
        @RequestParam(defaultValue = "30") days: Int,
        session: HttpSession
    ): ResponseEntity<Any> {
        logger.debug("Game trends requested for {} days", days)
        
        // Trends might be public or require authentication based on your needs
        // For now, making it public but you can add auth check if needed
        
        if (days < 1 || days > 365) {
            return ResponseEntity.badRequest()
                .body(ErrorResponse(
                    errorCode = "INVALID_PARAMETER",
                    message = "Days parameter must be between 1 and 365",
                    userFriendlyMessage = "일수는 1일에서 365일 사이여야 합니다."
                ))
        }
        
        return try {
            val trends = gameStatisticsService.getGameTrends(days)
            ResponseEntity.ok(trends)
        } catch (e: Exception) {
            logger.error("Failed to get game trends", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "STATISTICS_ERROR",
                    message = "Failed to retrieve game trends",
                    userFriendlyMessage = "게임 트렌드를 불러오는 중 오류가 발생했습니다."
                ))
        }
    }

    @GetMapping("/leaderboard")
    fun getLeaderboard(
        @RequestParam(defaultValue = "100") limit: Int
    ): ResponseEntity<Any> {
        logger.debug("Leaderboard requested with limit: {}", limit)
        
        if (limit < 1 || limit > 1000) {
            return ResponseEntity.badRequest()
                .body(ErrorResponse(
                    errorCode = "INVALID_PARAMETER",
                    message = "Limit parameter must be between 1 and 1000",
                    userFriendlyMessage = "제한 수는 1에서 1000 사이여야 합니다."
                ))
        }
        
        return try {
            val leaderboard = gameStatisticsService.getLeaderboard(limit)
            ResponseEntity.ok(mapOf("leaderboard" to leaderboard))
        } catch (e: Exception) {
            logger.error("Failed to get leaderboard", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "STATISTICS_ERROR",
                    message = "Failed to retrieve leaderboard",
                    userFriendlyMessage = "리더보드를 불러오는 중 오류가 발생했습니다."
                ))
        }
    }

    @GetMapping("/summary")
    fun getStatisticsSummary(): ResponseEntity<Any> {
        logger.debug("Statistics summary requested")
        
        return try {
            val globalStats = gameStatisticsService.getGlobalStatistics()
            
            val summary = mapOf(
                "totalGames" to globalStats.totalGames,
                "activeGames" to globalStats.activeGames,
                "totalPlayers" to globalStats.totalPlayers,
                "onlinePlayers" to globalStats.onlinePlayers,
                "averageGameDuration" to globalStats.averageGameDuration,
                "gameCompletionRate" to globalStats.gameCompletionRate,
                "dailyActiveUsers" to globalStats.dailyActiveUsers,
                "weeklyActiveUsers" to globalStats.weeklyActiveUsers,
                "popularSubjects" to globalStats.popularSubjects.take(5)
            )
            
            ResponseEntity.ok(summary)
        } catch (e: Exception) {
            logger.error("Failed to get statistics summary", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "STATISTICS_ERROR",
                    message = "Failed to retrieve statistics summary",
                    userFriendlyMessage = "통계 요약을 불러오는 중 오류가 발생했습니다."
                ))
        }
    }
}