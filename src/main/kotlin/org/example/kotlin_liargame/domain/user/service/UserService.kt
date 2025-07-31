package org.example.kotlin_liargame.domain.user.service

import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
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

    fun createUser(req : UserAddRequest) {
        val existingUser = userRepository.findByNickname(req.nickname)

        if (existingUser != null) {
            if (existingUser.isAuthenticated) {
                logger.debug("?�용???�성 ?�패: ?��? ?�증???�네?�입?�다 - {}", req.nickname)
                throw IllegalArgumentException("중복 ?�네?�이 불�??�합?�다. ?�른 ?�네?�을 ?�용?�주?�요.")
            } else if (existingUser.isActive) {
                logger.debug("?�용???�성 ?�패: ?��? ?�용 중인 비인�??�네?�입?�다 - {}", req.nickname)
                throw IllegalArgumentException("?��? ?�용 중인 비인�??�네?�입?�다. ?�른 ?�네?�을 ?�용?�주?�요.")
            } else {
                existingUser.toActive()
                userRepository.save(existingUser)
                logger.debug("?�용???�성 ?�공: 비활??비인�??�네???�활?�화 - {}", req.nickname)
                return
            }
        }

        val newUser = req.to()
        userRepository.save(newUser)
        logger.debug("?�용???�성 ?�공: ???�용???�성 - {}, ?�증 ?�태: {}", req.nickname, req.isAuthenticated)
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
        
        logger.debug("비인�??�용??비활?�화 배치 ?�업 ?�료: {} ?�용??비활?�화??, deactivatedCount)
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
        
        logger.debug("비활??비인�??�용????�� 배치 ?�업 ?�료: {} ?�용????��??, deletedCount)
    }
}
