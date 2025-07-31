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
                logger.debug("?¬ìš©???ì„± ?¤íŒ¨: ?´ë? ?¸ì¦???‰ë„¤?„ì…?ˆë‹¤ - {}", req.nickname)
                throw IllegalArgumentException("ì¤‘ë³µ ?‰ë„¤?„ì´ ë¶ˆê??¥í•©?ˆë‹¤. ?¤ë¥¸ ?‰ë„¤?„ì„ ?¬ìš©?´ì£¼?¸ìš”.")
            } else if (existingUser.isActive) {
                logger.debug("?¬ìš©???ì„± ?¤íŒ¨: ?´ë? ?¬ìš© ì¤‘ì¸ ë¹„ì¸ì¦??‰ë„¤?„ì…?ˆë‹¤ - {}", req.nickname)
                throw IllegalArgumentException("?´ë? ?¬ìš© ì¤‘ì¸ ë¹„ì¸ì¦??‰ë„¤?„ì…?ˆë‹¤. ?¤ë¥¸ ?‰ë„¤?„ì„ ?¬ìš©?´ì£¼?¸ìš”.")
            } else {
                existingUser.toActive()
                userRepository.save(existingUser)
                logger.debug("?¬ìš©???ì„± ?±ê³µ: ë¹„í™œ??ë¹„ì¸ì¦??‰ë„¤???¬í™œ?±í™” - {}", req.nickname)
                return
            }
        }

        val newUser = req.to()
        userRepository.save(newUser)
        logger.debug("?¬ìš©???ì„± ?±ê³µ: ???¬ìš©???ì„± - {}, ?¸ì¦ ?íƒœ: {}", req.nickname, req.isAuthenticated)
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
        
        logger.debug("ë¹„ì¸ì¦??¬ìš©??ë¹„í™œ?±í™” ë°°ì¹˜ ?‘ì—… ?„ë£Œ: {} ?¬ìš©??ë¹„í™œ?±í™”??, deactivatedCount)
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
        
        logger.debug("ë¹„í™œ??ë¹„ì¸ì¦??¬ìš©???? œ ë°°ì¹˜ ?‘ì—… ?„ë£Œ: {} ?¬ìš©???? œ??, deletedCount)
    }
}
