package org.example.kotlin_liargame.domain.auth.controller

import org.example.kotlin_liargame.domain.auth.dto.request.AdminLoginRequest
import org.example.kotlin_liargame.domain.auth.service.AdminService
import org.example.kotlin_liargame.global.dto.ErrorResponse
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

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
}