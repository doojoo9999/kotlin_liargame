package org.example.kotlin_liargame.domain.user.repository

import org.example.kotlin_liargame.domain.user.model.UserEntity
import org.example.kotlin_liargame.domain.user.model.UserTokenEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface UserTokenRepository : JpaRepository<UserTokenEntity, Long> {
    
    fun findByToken(token: String): UserTokenEntity?
    
    fun findByUser(user: UserEntity): List<UserTokenEntity>
    
    @Query("SELECT t FROM UserTokenEntity t WHERE t.user.id = :userId AND t.expiresAt > :now")
    fun findActiveTokensByUserId(@Param("userId") userId: Long, @Param("now") now: LocalDateTime = LocalDateTime.now()): List<UserTokenEntity>
    
    @Query("SELECT t FROM UserTokenEntity t WHERE t.user.nickname = :nickname AND t.expiresAt > :now")
    fun findActiveTokensByNickname(@Param("nickname") nickname: String, @Param("now") now: LocalDateTime = LocalDateTime.now()): List<UserTokenEntity>
    
    fun deleteByExpiresAtBefore(dateTime: LocalDateTime): Int
    
    fun deleteByUser(user: UserEntity): Int
    
    fun deleteByToken(token: String): Int
    
    fun existsByTokenAndExpiresAtAfter(token: String, dateTime: LocalDateTime): Boolean
}
