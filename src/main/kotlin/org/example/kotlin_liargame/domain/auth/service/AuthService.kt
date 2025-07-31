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
            logger.debug("�α��� ����: �̹� ������ �г����Դϴ� - {}", request.nickname)
            throw IllegalArgumentException("�ߺ� �г����� �Ұ����մϴ�. �ٸ� �г����� ������ּ���.")
        }

        val unauthenticatedUser = userRepository.findByNicknameAndIsAuthenticatedFalseAndIsActiveTrue(request.nickname)
        if (unauthenticatedUser != null) {
            logger.debug("�α��� ����: �̹� ��� ���� ������ �г����Դϴ� - {}", request.nickname)
            throw IllegalArgumentException("�̹� ��� ���� ������ �г����Դϴ�. �ٸ� �г����� ������ּ���.")
        }

        val activeTokens = userTokenRepository.findActiveTokensByNickname(request.nickname)
        if (activeTokens.isNotEmpty()) {
            logger.debug("�α��� ����: �̹� ��ū�� �߱޵� �г����Դϴ� - {}", request.nickname)
            throw IllegalArgumentException("�̹� ���� ���� �г����Դϴ�. �ٸ� �г����� ������ּ���.")
        }

        val inactiveUser = userRepository.findByNicknameAndIsAuthenticatedFalse(request.nickname)
        if (inactiveUser != null && !inactiveUser.isActive) {
            inactiveUser.toActive()
            inactiveUser.setTokenIssued()
            userRepository.save(inactiveUser)
            logger.debug("�α��� ����: ��Ȱ�� ������ �г��� ��Ȱ��ȭ - {}", request.nickname)

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
        logger.debug("�α��� ����: �� ������ ����� ���� - {}", request.nickname)

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
            profileImgUrl = "https:
        )
        val newUser = userAddRequest.to()
        return userRepository.save(newUser)
    }
}
