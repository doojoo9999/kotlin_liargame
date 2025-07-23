package org.example.kotlin_liargame.domain.auth.controller

import org.example.kotlin_liargame.domain.auth.dto.request.LoginRequest
import org.example.kotlin_liargame.domain.auth.service.AuthService
import org.example.kotlin_liargame.tools.security.jwt.TokenResponse
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(private val authService: AuthService) {

    @PostMapping("/login")
    fun login(
        req: LoginRequest
    ) : TokenResponse {

        return authService.login(req)
    }


}