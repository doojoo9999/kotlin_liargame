package org.example.kotlin_liargame.domain.auth.service

import org.example.kotlin_liargame.domain.auth.dto.request.AdminLoginRequest
import org.example.kotlin_liargame.domain.auth.dto.response.TokenResponse
import org.example.kotlin_liargame.tools.security.jwt.JwtProvider
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class AdminService(
    private val jwtProvider: JwtProvider,
    @Value("\${admin.password:admin123}")
    private val adminPassword: String
) {
    private val logger = LoggerFactory.getLogger(this::class.java)
    
    companion object {
        private const val ADMIN_USER_ID = -1L
        private const val ADMIN_NICKNAME = "admin"
    }

    fun login(request: AdminLoginRequest): TokenResponse {
        logger.debug("관리자 로그인 시도")
        
        if (request.password != adminPassword) {
            logger.debug("관리자 로그인 실패: 잘못된 비밀번호")
            throw IllegalArgumentException("잘못된 관리자 비밀번호입니다.")
        }
        
        // Generate admin tokens
        val accessToken = jwtProvider.generateAccessToken(ADMIN_USER_ID, ADMIN_NICKNAME)
        val refreshToken = jwtProvider.generateRefreshToken(ADMIN_USER_ID, ADMIN_NICKNAME)
        
        logger.debug("관리자 로그인 성공")
        
        return TokenResponse(accessToken = accessToken, refreshToken = refreshToken)
    }
}