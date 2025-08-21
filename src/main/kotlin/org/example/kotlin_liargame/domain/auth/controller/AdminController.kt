package org.example.kotlin_liargame.domain.auth.controller

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.auth.dto.request.KickPlayerRequest
import org.example.kotlin_liargame.domain.auth.service.AdminService
import org.example.kotlin_liargame.domain.game.service.GameTerminationService
import org.example.kotlin_liargame.domain.profanity.service.ProfanityService
import org.example.kotlin_liargame.global.dto.ErrorResponse
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/admin")
class AdminController(
    private val adminService: AdminService,
    private val gameTerminationService: GameTerminationService,
    private val profanityService: ProfanityService
) {

    private val logger = LoggerFactory.getLogger(this::class.java)

    private fun checkAdmin(session: HttpSession): Boolean {
        return session.getAttribute("isAdmin") as? Boolean ?: false
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
                    message = "관리자 권-한이 필요합니다",
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
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다"))
        }
        val requests = profanityService.getPendingRequests()
        return ResponseEntity.ok(requests)
    }

    @PostMapping("/profanity/approve/{requestId}")
    fun approveProfanityRequest(@PathVariable requestId: Long, session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다"))
        }
        profanityService.approveRequest(requestId)
        return ResponseEntity.ok().build()
    }

    @PostMapping("/profanity/reject/{requestId}")
    fun rejectProfanityRequest(@PathVariable requestId: Long, session: HttpSession): ResponseEntity<Any> {
        if (!checkAdmin(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse("UNAUTHORIZED", "관리자 권한이 필요합니다"))
        }
        profanityService.rejectRequest(requestId)
        return ResponseEntity.ok().build()
    }
}
