package org.example.kotlin_liargame.domain.user.service

import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.springframework.stereotype.Service

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

    fun deleteUser() {
                
    }


}