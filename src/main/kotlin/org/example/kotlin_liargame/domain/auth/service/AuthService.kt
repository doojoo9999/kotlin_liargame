package org.example.kotlin_liargame.domain.auth.service

import org.example.kotlin_liargame.domain.auth.dto.request.LoginRequest
import org.example.kotlin_liargame.domain.auth.dto.response.TokenResponse
import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
import org.example.kotlin_liargame.domain.user.model.UserEntity
import org.example.kotlin_liargame.domain.user.model.UserTokenEntity
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.domain.user.repository.UserTokenRepository
import org.example.kotlin_liargame.tools.security.jwt.JwtProvider
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class AuthService (
    private val userRepository: UserRepository,
    private val userTokenRepository: UserTokenRepository,
    private val jwtProvider: JwtProvider
){
    private val logger = LoggerFactory.getLogger(this::class.java)

    @Transactional
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

        val activeTokens = userTokenRepository.findActiveTokensByNickname(request.nickname)
        if (activeTokens.isNotEmpty()) {
            logger.debug("로그인 실패: 이미 토큰이 발급된 닉네임입니다 - {}", request.nickname)
            throw IllegalArgumentException("이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요.")
        }

        val inactiveUser = userRepository.findByNicknameAndIsAuthenticatedFalse(request.nickname)
        if (inactiveUser != null && !inactiveUser.isActive) {
            inactiveUser.toActive()
            inactiveUser.setTokenIssued()
            userRepository.save(inactiveUser)
            logger.debug("로그인 성공: 비활성 비인증 닉네임 재활성화 - {}", request.nickname)

            val token = jwtProvider.jwtBuild(
                userId = inactiveUser.id.toString(),
                nickname = inactiveUser.nickname,
                expireTime = 1000 * 60 * 60L
            )

            saveUserToken(inactiveUser, token)
            
            return TokenResponse(accessToken = token)
        }

        val newUser = createUser(request.nickname)
        newUser.setTokenIssued()
        userRepository.save(newUser)
        logger.debug("로그인 성공: 새 사용자 생성 완료 - {}", request.nickname)

        val token = jwtProvider.jwtBuild(
            userId = newUser.id.toString(),
            nickname = newUser.nickname,
            expireTime = 1000 * 60 * 60L
        )

        saveUserToken(newUser, token)
        
        return TokenResponse(accessToken = token)
    }
    
    @Transactional
    fun saveUserToken(user: UserEntity, token: String) {
        val expiresAt = jwtProvider.getTokenExpirationTime(token)

        val userToken = UserTokenEntity.create(user, token, expiresAt)
        userTokenRepository.save(userToken)
        
        logger.debug("Token saved for user: {}, expires at: {}", user.nickname, expiresAt)
    }
    
    @Transactional
    fun invalidateUserTokens(userId: Long) {
        val user = userRepository.findById(userId).orElse(null) ?: return

        val deletedCount = userTokenRepository.deleteByUser(user)

        if (deletedCount > 0) {
            user.hasTokenIssued = false
            userRepository.save(user)
            logger.debug("Invalidated {} tokens for user: {}", deletedCount, user.nickname)
        }
    }
    
    @Transactional
    fun cleanupExpiredTokens() {
        val now = LocalDateTime.now()
        val deletedCount = userTokenRepository.deleteByExpiresAtBefore(now)
        logger.debug("Cleaned up {} expired tokens", deletedCount)
    }

    private fun createUser(nickname: String): UserEntity {
        val userAddRequest = UserAddRequest(
            nickname = nickname,
            profileImgUrl = "https://example.com/default-profile.png"
        )
        val newUser = userAddRequest.to()
        return userRepository.save(newUser)
    }
}