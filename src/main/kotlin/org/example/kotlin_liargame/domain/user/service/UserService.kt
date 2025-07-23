package org.example.kotlin_liargame.domain.user.service

import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class UserService (
    private val userRepository : UserRepository
){

    fun createUser(req : UserAddRequest) {

        val existingUser = userRepository.findByNickname(req.nickname)

        if( existingUser != null ) {
            throw RuntimeException("User already exists")
        }

        val newbie = req.to()
        userRepository.save(newbie)

    }

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