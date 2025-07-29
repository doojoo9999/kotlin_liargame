package org.example.kotlin_liargame.domain.auth.controller

import org.example.kotlin_liargame.domain.auth.dto.request.LoginRequest
import org.example.kotlin_liargame.domain.auth.service.AuthService
import org.example.kotlin_liargame.global.dto.ErrorResponse
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(private val authService: AuthService) {

    private val logger = LoggerFactory.getLogger(this::class.java)

    @PostMapping("/login")
    fun login(
        @RequestBody req: LoginRequest
    ) : ResponseEntity<Any> {
        logger.debug("로그인 요청 nickname = {}", req.nickname)
        return try {
            val tokenResponse = authService.login(req)
            logger.debug("로그인 성공 nickname = {}", req.nickname)
            ResponseEntity.ok(tokenResponse)
        } catch (e: IllegalArgumentException) {
            logger.debug("로그인 실패 nickname = {}, 원인: {}", req.nickname, e.message)
            ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse(message = e.message ?: "로그인 실패"))
        } catch (e: Exception) {
            logger.error("로그인 중 오류 발생 nickname = {}", req.nickname, e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(message = "서버 오류가 발생했습니다"))
        }
    }
}