package org.example.kotlin_liargame.domain.auth.controller

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.auth.dto.request.AdminLoginRequest
import org.example.kotlin_liargame.domain.auth.dto.request.KickPlayerRequest
import org.example.kotlin_liargame.domain.auth.dto.request.TerminateRoomRequest
import org.example.kotlin_liargame.domain.auth.service.AdminService
import org.example.kotlin_liargame.domain.game.service.GameTerminationService
import org.example.kotlin_liargame.domain.profanity.service.ProfanityService
import org.example.kotlin_liargame.global.dto.ErrorResponse
import org.example.kotlin_liargame.global.security.SessionManagementService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/admin")
class AdminController(
    private val adminService: AdminService,
    private val gameTerminationService: GameTerminationService,
    private val profanityService: ProfanityService,
    private val sessionManagementService: SessionManagementService
) {

    private val logger = LoggerFactory.getLogger(this::class.java)

    private fun checkAdmin(session: HttpSession): Boolean {
        return sessionManagementService.isAdmin(session)
    }

    @PostMapping("/games/{gameNumber}/kick")
    fun kickPlayer(
        @PathVariable gameNumber: Int,
        @RequestBody request: KickPlayerRequest,
        session: HttpSession
    ): ResponseEntity<Any> {
        logger.debug("플레이어 강제 퇴장 요청: gameNumber={}, userId={}", gameNumber, request.userId)
        
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(
                    errorCode = "UNAUTHORIZED",
                    message = "관리자 권한이 필요합니다",
                    userFriendlyMessage = "관리자 권한이 필요합니다."
                ))
        }
        
        return try {
            val result = adminService.kickPlayer(gameNumber, request.userId)
            ResponseEntity.ok(mapOf("success" to result))
        } catch (e: IllegalArgumentException) {
            logger.debug("플레이어 강제 퇴장 실패: {}", e.message)
            ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse(
                    errorCode = "INVALID_REQUEST",
                    message = e.message ?: "플레이어 강제 퇴장 실패",
                    userFriendlyMessage = "플레이어 강제 퇴장에 실패했습니다."
                ))
        } catch (e: Exception) {
            logger.error("플레이어 강제 퇴장 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "INTERNAL_ERROR",
                    message = "플레이어 강제 퇴장 중 서버 오류가 발생했습니다",
                    userFriendlyMessage = "플레이어 강제 퇴장 중 서버 오류가 발생했습니다."
                ))
        }
    }

    @GetMapping("/profanity/requests")
    fun getPendingProfanityRequests(session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다", "관리자 권한이 필요합니다"))
        }
        val requests = profanityService.getPendingRequests()
        return ResponseEntity.ok(requests)
    }

    @PostMapping("/profanity/approve/{requestId}")
    fun approveProfanityRequest(@PathVariable requestId: Long, session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다", "관리자 권한이 필요합니다"))
        }
        profanityService.approveRequest(requestId)
        return ResponseEntity.ok().build()
    }

    @PostMapping("/profanity/reject/{requestId}")
    fun rejectProfanityRequest(@PathVariable requestId: Long, session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다", "관리자 권한이 필요합니다"))
        }
        profanityService.rejectRequest(requestId)
        return ResponseEntity.ok().build()
    }

    @PostMapping("/login")
    fun adminLogin(@RequestBody request: AdminLoginRequest, session: HttpSession): ResponseEntity<Any> {
        val adminUser = adminService.login(request)

        // JSON 직렬화 방식으로 관리자 세션 등록
        sessionManagementService.registerAdminSession(
            session,
            adminUser.nickname,
            adminUser.id,
            setOf("ADMIN", "USER_MANAGEMENT", "CONTENT_MODERATION")
        )

        return ResponseEntity.ok(mapOf("success" to true, "nickname" to adminUser.nickname))
    }

    @PostMapping("/grant-role/{userId}")
    fun grantAdminRole(@PathVariable userId: Long, session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다", "관리자 권한이 필요합니다"))
        }
        adminService.grantAdminRole(userId)
        return ResponseEntity.ok(mapOf("success" to true))
    }

    @PostMapping("/terminate-room")
    fun terminateRoom(@RequestBody request: TerminateRoomRequest, session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다", "관리자 권한이 필요합니다"))
        }
        val result = adminService.terminateGameRoom(request.gameNumber)
        return ResponseEntity.ok(mapOf("success" to result))
    }

    @GetMapping("/content/pending")
    fun getPendingContents(session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다", "관리자 권한이 필요합니다"))
        }
        val pendingContents = adminService.getPendingContents()
        return ResponseEntity.ok(pendingContents)
    }

    @PostMapping("/content/approve-all")
    fun approveAllPendingContents(session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다", "관리자 권한이 필요합니다"))
        }
        adminService.approveAllPendingContents()
        return ResponseEntity.ok(mapOf("success" to true))
    }

    @PostMapping("/cleanup/stale-games")
    fun cleanupStaleGames(session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다", "관리자 권한이 필요합니다"))
        }

        return try {
            val cleanedCount = adminService.cleanupStaleGames()
            logger.debug("오래된 게임방 정리 완료: {}개", cleanedCount)
            ResponseEntity.ok(mapOf(
                "success" to true,
                "cleanedGames" to cleanedCount,
                "message" to "${cleanedCount}개의 오래된 게임방이 정리되었습니다."
            ))
        } catch (e: Exception) {
            logger.error("게임방 정리 중 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "CLEANUP_ERROR",
                    message = "게임방 정리 중 오류가 발생했습니다",
                    userFriendlyMessage = "게임방 정리 중 오류가 발생했습니다."
                ))
        }
    }

    @PostMapping("/cleanup/disconnected-players")
    fun cleanupDisconnectedPlayers(session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다", "관리자 권한이 필요합니다"))
        }

        return try {
            // 실제 연결이 끊어진 플레이��들을 정리
            val cleanedCount = adminService.cleanupDisconnectedPlayers()
            logger.debug("연결 해제된 플레이어 정리 완료: {}명", cleanedCount)
            ResponseEntity.ok(mapOf(
                "success" to true,
                "cleanedPlayers" to cleanedCount,
            // 실제 연결이 끊어진 플레이어들을 정리
            ))
        } catch (e: Exception) {
            logger.error("연결 해제된 플레이어 정리 중 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "CLEANUP_ERROR",
                    message = "연결 해제된 플레이어 정리 중 오류가 발생했습니다",
                    userFriendlyMessage = "연결 해제된 플레이어 정리 중 오류가 발생했습니다."
                ))
        }
    }

    @PostMapping("/cleanup/empty-games")
    fun cleanupEmptyGames(session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다", "관리자 권한이 필요합니다"))
        }

        return try {
            val cleanedCount = adminService.cleanupEmptyGames()
            logger.debug("빈 게임방 정리 완료: {}개", cleanedCount)
            ResponseEntity.ok(mapOf(
                "success" to true,
                "cleanedGames" to cleanedCount,
                "message" to "${cleanedCount}개의 빈 게임방이 정리되었습니다."
            ))
        } catch (e: Exception) {
            logger.error("빈 게임방 정리 중 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(
                    errorCode = "CLEANUP_ERROR",
                    message = "빈 게임방 정리 중 오류가 발생했습니다",
                    userFriendlyMessage = "빈 게임방 정리 중 오류가 발생했습니다."
                ))
        }
    }

    @GetMapping("/statistics")
    fun getGameStatistics(session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다", "관리자 권한이 필요합니다"))
        }

        val statistics = adminService.getGameStatistics()
        return ResponseEntity.ok(statistics)
    }

    @GetMapping("/games")
    fun getAllActiveGames(session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다", "관리자 권한이 필요합니다"))
        }

        val games = adminService.getAllActiveGames()
        return ResponseEntity.ok(mapOf("games" to games))
    }

    @GetMapping("/players")
    fun getAllPlayers(session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다", "관리자 권한이 필요합니다"))
        }

        val players = adminService.getAllPlayers()
        return ResponseEntity.ok(players)
    }
}
