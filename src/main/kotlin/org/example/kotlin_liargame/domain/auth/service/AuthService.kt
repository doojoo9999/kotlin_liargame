package org.example.kotlin_liargame.domain.auth.service

import org.example.kotlin_liargame.domain.auth.dto.request.LoginRequest
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.tools.security.jwt.JwtProvider
import org.example.kotlin_liargame.tools.security.jwt.TokenResponse
import org.springframework.stereotype.Service

@Service
class AuthService (
    private val userRepository: UserRepository,
    private val jwtProvider: JwtProvider
){

    fun login(request: LoginRequest): TokenResponse {
        val user = userRepository.findByNicknameAndIsActiveTrue(request.nickname)
            ?: throw IllegalArgumentException("�������� �ʴ� �г����Դϴ�")

        // JWT ��ū ���� (1�ð� ��ȿ)
        val token = jwtProvider.jwtBuild(
            userId = user.id.toString(),
            nickname = user.nickname,
            expireTime = 1000 * 60 * 60L
        )

        return TokenResponse(accessToken = token)
    }


}