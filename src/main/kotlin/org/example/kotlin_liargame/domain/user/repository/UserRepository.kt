package org.example.kotlin_liargame.domain.user.repository

import org.example.kotlin_liargame.domain.user.model.UserEntity
import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository : JpaRepository<UserEntity, Long> {

    fun findByNickname (nickname: String): UserEntity?

    fun findByNicknameAndIsActiveTrue(nickname: String): UserEntity?
    
    fun findByNicknameAndIsAuthenticatedTrue(nickname: String): UserEntity?
    
    fun findByNicknameAndIsAuthenticatedFalse(nickname: String): UserEntity?
    
    fun findByNicknameAndIsAuthenticatedTrueAndIsActiveTrue(nickname: String): UserEntity?
    
    fun findByNicknameAndIsAuthenticatedFalseAndIsActiveTrue(nickname: String): UserEntity?
    
    fun findByNicknameAndIsAuthenticatedFalseAndHasTokenIssuedTrue(nickname: String): UserEntity?

}