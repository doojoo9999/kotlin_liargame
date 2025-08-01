package org.example.kotlin_liargame.domain.auth.controller

import org.example.kotlin_liargame.domain.auth.dto.request.LoginRequest
import org.example.kotlin_liargame.domain.auth.dto.request.RefreshRequest
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
        logger.debug("�α��� ��û nickname = {}", req.nickname)
        return try {
            val tokenResponse = authService.login(req)
            logger.debug("�α��� ���� nickname = {}", req.nickname)
            ResponseEntity.ok(tokenResponse)
        } catch (e: IllegalArgumentException) {
            logger.debug("�α��� ���� nickname = {}, ����: {}", req.nickname, e.message)
            ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse(message = e.message ?: "�α��� ����"))
        } catch (e: Exception) {
            logger.error("�α��� �� ���� �߻� nickname = {}", req.nickname, e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(message = "���� ������ �߻��߽��ϴ�"))
        }
    }

    @PostMapping("/refresh")
    fun refresh(
        @RequestBody req: RefreshRequest
    ) : ResponseEntity<Any> {
        logger.debug("토큰 리프레시 요청")
        return try {
            val tokenResponse = authService.refresh(req)
            logger.debug("토큰 리프레시 성공")
            ResponseEntity.ok(tokenResponse)
        } catch (e: IllegalArgumentException) {
            logger.debug("토큰 리프레시 실패: {}", e.message)
            ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse(message = e.message ?: "토큰 리프레시 실패"))
        } catch (e: Exception) {
            logger.error("토큰 리프레시 중 서버 오류 발생", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse(message = "서버 오류가 발생했습니다"))
        }
    }
}
