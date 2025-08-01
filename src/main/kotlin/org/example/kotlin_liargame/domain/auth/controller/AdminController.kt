package org.example.kotlin_liargame.domain.auth.controller

import org.example.kotlin_liargame.domain.auth.dto.request.AdminLoginRequest
import org.example.kotlin_liargame.domain.auth.dto.request.TerminateRoomRequest
import org.example.kotlin_liargame.domain.auth.service.AdminService
import org.example.kotlin_liargame.global.dto.ErrorResponse
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/admin")
class AdminController(private val adminService: AdminService) {

    private val logger = LoggerFactory.getLogger(this::class.java)

    @PostMapping("/login")
    fun login(
        @RequestBody req: AdminLoginRequest
    ): ResponseEntity<Any> {
        logger.debug("관리자 로그인 요청")
        return try {
            val tokenResponse = adminService.login(req)
            logger.debug("관리자 로그인 성공")
            ResponseEntity.ok(tokenResponse)
        } catch (e: IllegalArgumentException) {
            logger.debug("관리자 로그인 실패: {}", e.message)
            ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(message = e.message ?: "관리자 로그인 실패"))
        } catch (e: Exception) {
            logger.error("관리자 로그인 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(message = "서버 오류가 발생했습니다"))
        }
    }

    @GetMapping("/stats")
    fun getStatistics(): ResponseEntity<Any> {
        logger.debug("관리자 통계 조회 요청")
        return try {
            val stats = adminService.getStatistics()
            logger.debug("관리자 통계 조회 성공")
            ResponseEntity.ok(stats)
        } catch (e: Exception) {
            logger.error("관리자 통계 조회 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(message = "통계 조회 중 서버 오류가 발생했습니다"))
        }
    }

    @GetMapping("/players")
    fun getAllPlayers(): ResponseEntity<Any> {
        logger.debug("관리자 플레이어 목록 조회 요청")
        return try {
            val players = adminService.getAllPlayers()
            logger.debug("관리자 플레이어 목록 조회 성공")
            ResponseEntity.ok(players)
        } catch (e: Exception) {
            logger.error("관리자 플레이어 목록 조회 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(message = "플레이어 목록 조회 중 서버 오류가 발생했습니다"))
        }
    }

    @PostMapping("/terminate-room")
    fun terminateGameRoom(
        @RequestBody request: TerminateRoomRequest
    ): ResponseEntity<Any> {
        logger.debug("게임방 강제 종료 요청: {}", request.gameNumber)
        return try {
            val result = adminService.terminateGameRoom(request.gameNumber)
            logger.debug("게임방 강제 종료 성공: {}", request.gameNumber)
            ResponseEntity.ok(mapOf("success" to result))
        } catch (e: IllegalArgumentException) {
            logger.debug("게임방 강제 종료 실패: {}", e.message)
            ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse(message = e.message ?: "게임방 강제 종료 실패"))
        } catch (e: Exception) {
            logger.error("게임방 강제 종료 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(message = "게임방 강제 종료 중 서버 오류가 발생했습니다"))
        }
    }
}