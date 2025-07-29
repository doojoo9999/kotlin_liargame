package org.example.kotlin_liargame.domain.auth.controller

import org.example.kotlin_liargame.domain.auth.dto.request.LoginRequest
import org.example.kotlin_liargame.domain.auth.service.AuthService
import org.example.kotlin_liargame.tools.security.jwt.TokenResponse
import org.slf4j.LoggerFactory
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
    ) : TokenResponse {
        logger.debug("로그인 요청 username = {}", req.username)
        return authService.login(req).also {
            logger.debug("로그인 성공 username = {}", req.username)
        }
    }


}