package org.example.kotlin_liargame.domain.user.service

import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class UserService (
    private val userRepository : UserRepository
){

    fun createUser(req : UserAddRequest) {

        val existingUser = userRepository.findByNickname(req.nickname)

        if( existingUser != null ) {
            throw RuntimeException("사용자가 이미 존재합니다")
        }

        val newbie = req.to()
        userRepository.save(newbie)

    }

    @Scheduled(fixedRate = 4 * 60 * 60 * 1000)
    fun batchToUnActiveUser() {
        val now = LocalDateTime.now()
        val users = userRepository.findAll()

        users.forEach { user ->
            if (user.modifiedAt.plusHours(48).isBefore(now)) {
                user.toUnActive()
                userRepository.save(user)
            }
        }
    }

    @Scheduled(fixedRate = 4 * 60 * 60 * 1000)
    fun deleteUser() {
        val now = LocalDateTime.now()
        val users = userRepository.findAll()

        users.forEach { user ->
            if (!user.isActive && user.modifiedAt.plusHours(24).isBefore(now)) {
                userRepository.delete(user)
            }
        }
    }


}