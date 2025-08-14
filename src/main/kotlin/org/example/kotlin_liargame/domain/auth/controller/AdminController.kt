package org.example.kotlin_liargame.domain.auth.controller

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.auth.dto.request.AdminLoginRequest
import org.example.kotlin_liargame.domain.auth.dto.request.TerminateRoomRequest
import org.example.kotlin_liargame.domain.auth.service.AdminService
import org.example.kotlin_liargame.domain.game.service.AbnormalCondition
import org.example.kotlin_liargame.domain.game.service.GameTerminationService
import org.example.kotlin_liargame.global.dto.ErrorResponse
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/admin")
class AdminController(
    private val adminService: AdminService,
    private val gameTerminationService: GameTerminationService
) {

    private val logger = LoggerFactory.getLogger(this::class.java)

    @PostMapping("/login")
    fun login(
        @RequestBody req: AdminLoginRequest,
        request: HttpServletRequest
    ): ResponseEntity<Any> {
        logger.debug("관리자 로그인 요청")
        return try {
            val loginResponse = adminService.login(req, request)
            logger.debug("관리자 로그인 성공")
            ResponseEntity.ok(loginResponse)
        } catch (e: IllegalArgumentException) {
            logger.debug("관리자 로그인 실패: {}", e.message)
            ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(
                    errorCode = "ADMIN_LOGIN_FAILED",
                    message = e.message ?: "관리자 로그인 실패",
                    userFriendlyMessage = "관리자 로그인에 실패했습니다."
                ))
        } catch (e: Exception) {
            logger.error("관리자 로그인 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "INTERNAL_ERROR",
                    message = "서버 오류가 발생했습니다",
                    userFriendlyMessage = "서버 오류가 발생했습니다."
                ))
        }
    }

    @GetMapping("/stats")
    fun getStats(session: HttpSession): ResponseEntity<Any> {
        // 세션에서 관리자 권한 확인
        val isAdmin = session.getAttribute("isAdmin") as? Boolean ?: false
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(
                    errorCode = "UNAUTHORIZED",
                    message = "관리자 권한이 필요합니다",
                    userFriendlyMessage = "관리자 권한이 필요합니다."
                ))
        }
        
        val stats = adminService.getStatistics()
        return ResponseEntity.ok(stats)
    }

    @GetMapping("/players")
    fun getAllPlayers(session: HttpSession): ResponseEntity<Any> {
        logger.debug("관리자 플레이어 목록 조회 요청")
        
        // 세션에서 관리자 권한 확인
        val isAdmin = session.getAttribute("isAdmin") as? Boolean ?: false
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(
                    errorCode = "UNAUTHORIZED",
                    message = "관리자 권한이 필요합니다",
                    userFriendlyMessage = "관리자 권한이 필요합니다."
                ))
        }
        
        return try {
            val players = adminService.getAllPlayers()
            logger.debug("관리자 플레이어 목록 조회 성공")
            ResponseEntity.ok(players)
        } catch (e: Exception) {
            logger.error("관리자 플레이어 목록 조회 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "INTERNAL_ERROR",
                    message = "플레이어 목록 조회 중 서버 오류가 발생했습니다",
                    userFriendlyMessage = "플레이어 목록 조회 중 서버 오류가 발생했습니다."
                ))
        }
    }

    @PostMapping("/terminate-room")
    fun terminateGameRoom(
        @RequestBody request: TerminateRoomRequest,
        session: HttpSession
    ): ResponseEntity<Any> {
        logger.debug("게임방 강제 종료 요청: {}", request.gameNumber)
        
        // 세션에서 관리자 권한 확인
        val isAdmin = session.getAttribute("isAdmin") as? Boolean ?: false
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(
                    errorCode = "UNAUTHORIZED",
                    message = "관리자 권한이 필요합니다",
                    userFriendlyMessage = "관리자 권한이 필요합니다."
                ))
        }
        
        return try {
            val result = adminService.terminateGameRoom(request.gameNumber)
            logger.debug("게임방 강제 종료 성공: {}", request.gameNumber)
            ResponseEntity.ok(mapOf("success" to result))
        } catch (e: IllegalArgumentException) {
            logger.debug("게임방 강제 종료 실패: {}", e.message)
            ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse(
                    errorCode = "INVALID_REQUEST",
                    message = e.message ?: "게임방 강제 종료 실패",
                    userFriendlyMessage = "게임방 강제 종료에 실패했습니다."
                ))
        } catch (e: Exception) {
            logger.error("게임방 강제 종료 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "INTERNAL_ERROR",
                    message = "게임방 강제 종료 중 서버 오류가 발생했습니다",
                    userFriendlyMessage = "게임방 강제 종료 중 서버 오류가 발생했습니다."
                ))
        }
    }

    @PostMapping("/games/{gameNumber}/terminate")
    fun forceTerminateGame(
        @PathVariable gameNumber: Int,
        @RequestBody request: AdminTerminationRequest,
        session: HttpSession
    ): ResponseEntity<Any> {
        logger.debug("게임 강제 종료 요청: {}", gameNumber)
        
        // 세션에서 관리자 권한 확인
        val isAdmin = session.getAttribute("isAdmin") as? Boolean ?: false
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(
                    errorCode = "UNAUTHORIZED",
                    message = "관리자 권한이 필요합니다",
                    userFriendlyMessage = "관리자 권한이 필요합니다."
                ))
        }
        
        return try {
            val response = gameTerminationService.forceTerminateGame(gameNumber, request.reason)
            logger.debug("게임 강제 종료 성공: {}", gameNumber)
            
            if (response.success) {
                ResponseEntity.ok(response)
            } else {
                ResponseEntity.badRequest().body(response)
            }
        } catch (e: Exception) {
            logger.error("게임 강제 종료 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "INTERNAL_ERROR",
                    message = "게임 강제 종료 중 서버 오류가 발생했습니다",
                    userFriendlyMessage = "게임 강제 종료 중 서버 오류가 발생했습니다."
                ))
        }
    }

    @PostMapping("/games/{gameNumber}/monitor")
    fun startGameMonitoring(
        @PathVariable gameNumber: Int,
        session: HttpSession
    ): ResponseEntity<Any> {
        logger.debug("게임 모니터링 시작 요청: {}", gameNumber)
        
        // 세션에서 관리자 권한 확인
        val isAdmin = session.getAttribute("isAdmin") as? Boolean ?: false
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(
                    errorCode = "UNAUTHORIZED",
                    message = "관리자 권한이 필요합니다",
                    userFriendlyMessage = "관리자 권한이 필요합니다."
                ))
        }
        
        return try {
            gameTerminationService.startGameMonitoring(gameNumber)
            logger.debug("게임 모니터링 시작 성공: {}", gameNumber)
            ResponseEntity.ok(mapOf(
                "message" to "Game monitoring started",
                "gameNumber" to gameNumber
            ))
        } catch (e: Exception) {
            logger.error("게임 모니터링 시작 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "INTERNAL_ERROR",
                    message = "게임 모니터링 시작 중 서버 오류가 발생했습니다",
                    userFriendlyMessage = "게임 모니터링 시작 중 서버 오류가 발생했습니다."
                ))
        }
    }

    @DeleteMapping("/games/{gameNumber}/monitor")
    fun stopGameMonitoring(
        @PathVariable gameNumber: Int,
        session: HttpSession
    ): ResponseEntity<Any> {
        logger.debug("게임 모니터링 중지 요청: {}", gameNumber)
        
        // 세션에서 관리자 권한 확인
        val isAdmin = session.getAttribute("isAdmin") as? Boolean ?: false
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(
                    errorCode = "UNAUTHORIZED",
                    message = "관리자 권한이 필요합니다",
                    userFriendlyMessage = "관리자 권한이 필요합니다."
                ))
        }
        
        return try {
            gameTerminationService.stopGameMonitoring(gameNumber)
            logger.debug("게임 모니터링 중지 성공: {}", gameNumber)
            ResponseEntity.ok(mapOf(
                "message" to "Game monitoring stopped",
                "gameNumber" to gameNumber
            ))
        } catch (e: Exception) {
            logger.error("게임 모니터링 중지 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "INTERNAL_ERROR",
                    message = "게임 모니터링 중지 중 서버 오류가 발생했습니다",
                    userFriendlyMessage = "게임 모니터링 중지 중 서버 오류가 발생했습니다."
                ))
        }
    }

    @PostMapping("/games/{gameNumber}/auto-terminate")
    fun triggerAutoTermination(
        @PathVariable gameNumber: Int,
        @RequestBody request: AutoTerminationRequest,
        session: HttpSession
    ): ResponseEntity<Any> {
        logger.debug("게임 자동 종료 요청: {}", gameNumber)
        
        // 세션에서 관리자 권한 확인
        val isAdmin = session.getAttribute("isAdmin") as? Boolean ?: false
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(
                    errorCode = "UNAUTHORIZED",
                    message = "관리자 권한이 필요합니다",
                    userFriendlyMessage = "관리자 권한이 필요합니다."
                ))
        }
        
        return try {
            val condition = when (request.condition.uppercase()) {
                "ALL_PLAYERS_DISCONNECTED" -> AbnormalCondition.ALL_PLAYERS_DISCONNECTED
                "GAME_STUCK" -> AbnormalCondition.GAME_STUCK
                "SERVER_ERROR" -> AbnormalCondition.SERVER_ERROR
                "TIMEOUT_EXCEEDED" -> AbnormalCondition.TIMEOUT_EXCEEDED
                else -> throw IllegalArgumentException("Invalid condition: ${request.condition}")
            }
            
            val response = gameTerminationService.autoTerminateGame(gameNumber, condition)
            logger.debug("게임 자동 종료 성공: {}", gameNumber)
            
            if (response.success) {
                ResponseEntity.ok(response)
            } else {
                ResponseEntity.badRequest().body(response)
            }
        } catch (e: IllegalArgumentException) {
            logger.debug("게임 자동 종료 실패: {}", e.message)
            ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse(
                    errorCode = "INVALID_REQUEST",
                    message = e.message ?: "게임 자동 종료 실패",
                    userFriendlyMessage = "게임 자동 종료에 실패했습니다."
                ))
        } catch (e: Exception) {
            logger.error("게임 자동 종료 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "INTERNAL_ERROR",
                    message = "게임 자동 종료 중 서버 오류가 발생했습니다",
                    userFriendlyMessage = "게임 자동 종료 중 서버 오류가 발생했습니다."
                ))
        }
    }

    @GetMapping("/termination/stats")
    fun getTerminationStats(session: HttpSession): ResponseEntity<Any> {
        logger.debug("종료 통계 조회 요청")
        
        // 세션에서 관리자 권한 확인
        val isAdmin = session.getAttribute("isAdmin") as? Boolean ?: false
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(
                    errorCode = "UNAUTHORIZED",
                    message = "관리자 권한이 필요합니다",
                    userFriendlyMessage = "관리자 권한이 필요합니다."
                ))
        }
        
        return try {
            val stats = gameTerminationService.getTerminationStats()
            logger.debug("종료 통계 조회 성공")
            ResponseEntity.ok(stats)
        } catch (e: Exception) {
            logger.error("종료 통계 조회 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "INTERNAL_ERROR",
                    message = "종료 통계 조회 중 서버 오류가 발생했습니다",
                    userFriendlyMessage = "종료 통계 조회 중 서버 오류가 발생했습니다."
                ))
        }
    }

    @GetMapping("/health")
    fun healthCheck(): ResponseEntity<Any> {
        return ResponseEntity.ok(mapOf(
            "status" to "OK",
            "service" to "Admin Controller",
            "timestamp" to java.time.Instant.now()
        ))
    }
}

data class AdminTerminationRequest(
    val reason: String,
    val adminId: String? = null
)

data class AutoTerminationRequest(
    val condition: String
)