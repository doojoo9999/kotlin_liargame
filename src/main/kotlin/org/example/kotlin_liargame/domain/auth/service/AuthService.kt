package org.example.kotlin_liargame.domain.auth.service

import org.example.kotlin_liargame.domain.auth.dto.request.LoginRequest
import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
import org.example.kotlin_liargame.domain.user.model.UserEntity
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.tools.security.jwt.JwtProvider
import org.example.kotlin_liargame.tools.security.jwt.TokenResponse
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class AuthService (
    private val userRepository: UserRepository,
    private val jwtProvider: JwtProvider
){
    private val logger = LoggerFactory.getLogger(this::class.java)

    fun login(request: LoginRequest): TokenResponse {
        val authenticatedUser = userRepository.findByNicknameAndIsAuthenticatedTrueAndIsActiveTrue(request.nickname)
        if (authenticatedUser != null) {
            logger.debug("로그인 실패: 이미 인증된 닉네임입니다 - {}", request.nickname)
            throw IllegalArgumentException("중복 닉네임이 불가능합니다. 다른 닉네임을 사용해주세요.")
        }

        val unauthenticatedUser = userRepository.findByNicknameAndIsAuthenticatedFalseAndIsActiveTrue(request.nickname)
        if (unauthenticatedUser != null) {
            logger.debug("로그인 실패: 이미 사용 중인 비인증 닉네임입니다 - {}", request.nickname)
            throw IllegalArgumentException("이미 사용 중인 비인증 닉네임입니다. 다른 닉네임을 사용해주세요.")
        }

        val inactiveUser = userRepository.findByNicknameAndIsAuthenticatedFalse(request.nickname)
        if (inactiveUser != null && !inactiveUser.isActive) {
            inactiveUser.toActive()
            userRepository.save(inactiveUser)
            logger.debug("로그인 성공: 비활성 비인증 닉네임 재활성화 - {}", request.nickname)
            
            val token = jwtProvider.jwtBuild(
                userId = inactiveUser.id.toString(),
                nickname = inactiveUser.nickname,
                expireTime = 1000 * 60 * 60L
            )
            
            return TokenResponse(accessToken = token)
        }

        val newUser = createUser(request.nickname)
        logger.debug("로그인 성공: 새 비인증 사용자 생성 - {}", request.nickname)
        
        val token = jwtProvider.jwtBuild(
            userId = newUser.id.toString(),
            nickname = newUser.nickname,
            expireTime = 1000 * 60 * 60L
        )
        
        return TokenResponse(accessToken = token)
    }

    private fun createUser(nickname: String): UserEntity {
        val userAddRequest = UserAddRequest(
            nickname = nickname,
            profileImgUrl = "https://example.com/default-profile.jpg" // Default profile image
        )
        val newUser = userAddRequest.to()
        return userRepository.save(newUser)
    }
}