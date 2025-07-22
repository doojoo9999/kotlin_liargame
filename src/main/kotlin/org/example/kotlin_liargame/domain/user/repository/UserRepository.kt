package org.example.kotlin_liargame.domain.user.repository

import org.example.kotlin_liargame.domain.user.model.UserEntity
import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository : JpaRepository<UserEntity, Long> {

    fun findByNickname (nickname: String): UserEntity?

}