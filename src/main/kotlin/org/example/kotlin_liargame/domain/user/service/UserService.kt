package org.example.kotlin_liargame.domain.user.service

import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
import org.example.kotlin_liargame.domain.user.model.UserEntity
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class UserService (
    private val userRepository : UserRepository
){
    private val logger = LoggerFactory.getLogger(this::class.java)

    fun authenticate(nickname: String, password: String): UserEntity {
        logger.debug("Authentication attempt for nickname: {}", nickname)
        
        // For now, we'll implement simple nickname-based authentication
        // Password validation can be added later if needed
        val authenticatedUser = userRepository.findByNicknameAndIsAuthenticatedTrueAndIsActiveTrue(nickname)
        if (authenticatedUser != null) {
            logger.debug("Authentication failed: Already authenticated nickname - {}", nickname)
            throw IllegalArgumentException("중복 닉네임이 불가능합니다. 다른 닉네임을 사용해주세요.")
        }

        val unauthenticatedUser = userRepository.findByNicknameAndIsAuthenticatedFalseAndIsActiveTrue(nickname)
        if (unauthenticatedUser != null) {
            logger.debug("Authentication failed: Already in use unauthenticated nickname - {}", nickname)
            throw IllegalArgumentException("이미 사용 중인 비인증 닉네임입니다. 다른 닉네임을 사용해주세요.")
        }

        val inactiveUser = userRepository.findByNicknameAndIsAuthenticatedFalse(nickname)
        if (inactiveUser != null && !inactiveUser.isActive) {
            inactiveUser.toActive()
            userRepository.save(inactiveUser)
            logger.debug("Authentication success: Reactivated inactive unauthenticated nickname - {}", nickname)
            return inactiveUser
        }

        // Create new user
        val userAddRequest = UserAddRequest(
            nickname = nickname,
            profileImgUrl = "https://example.com/default-profile.png"
        )
        val newUser = userAddRequest.to()
        userRepository.save(newUser)
        logger.debug("Authentication success: New user created - {}", nickname)
        return newUser
    }

    fun findById(userId: Long): UserEntity {
        return userRepository.findById(userId).orElseThrow {
            IllegalArgumentException("사용자를 찾을 수 없습니다.")
        }
    }

    fun createUser(req : UserAddRequest) {
        val existingUser = userRepository.findByNickname(req.nickname)

        if (existingUser != null) {
            if (existingUser.isAuthenticated) {
                logger.debug("사용자 생성 실패: 이미 인증된 닉네임입니다 - {}", req.nickname)
                throw IllegalArgumentException("중복 닉네임이 불가능합니다. 다른 닉네임을 사용해주세요.")
            } else if (existingUser.isActive) {
                logger.debug("사용자 생성 실패: 이미 사용 중인 비인증 닉네임입니다 - {}", req.nickname)
                throw IllegalArgumentException("이미 사용 중인 비인증 닉네임입니다. 다른 닉네임을 사용해주세요.")
            } else {
                existingUser.toActive()
                userRepository.save(existingUser)
                logger.debug("사용자 생성 성공: 비활성 비인증 닉네임 재활성화 - {}", req.nickname)
                return
            }
        }

        val newUser = req.to()
        userRepository.save(newUser)
        logger.debug("사용자 생성 성공: 새 사용자 생성 - {}, 인증 상태: {}", req.nickname, req.isAuthenticated)
    }

    @Scheduled(fixedRate = 4 * 60 * 60 * 1000)
    fun batchToUnActiveUser() {
        val now = LocalDateTime.now()
        val users = userRepository.findAll()
        var deactivatedCount = 0

        users.forEach { user ->
            if (!user.isAuthenticated && user.isActive && user.modifiedAt.plusHours(48).isBefore(now)) {
                user.toUnActive()
                userRepository.save(user)
                deactivatedCount++
            }
        }
        
        logger.debug("비인증 사용자 비활성화 배치 작업 완료: {} 사용자 비활성화됨", deactivatedCount)
    }

    @Scheduled(fixedRate = 4 * 60 * 60 * 1000)
    fun deleteUser() {
        val now = LocalDateTime.now()
        val users = userRepository.findAll()
        var deletedCount = 0

        users.forEach { user ->
            if (!user.isAuthenticated && !user.isActive && user.modifiedAt.plusHours(24).isBefore(now)) {
                userRepository.delete(user)
                deletedCount++
            }
        }
        
        logger.debug("비활성 비인증 사용자 삭제 배치 작업 완료: {} 사용자 삭제됨", deletedCount)
    }
}