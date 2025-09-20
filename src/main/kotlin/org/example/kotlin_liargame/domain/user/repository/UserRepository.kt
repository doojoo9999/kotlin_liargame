package org.example.kotlin_liargame.domain.user.repository

import org.example.kotlin_liargame.domain.statistics.repository.PlayerGrowthStatInfo
import org.example.kotlin_liargame.domain.user.model.UserEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface UserRepository : JpaRepository<UserEntity, Long> {

    fun findByNickname (nickname: String): UserEntity?

    fun findByNicknameAndIsActiveTrue(nickname: String): UserEntity?
    
    fun findByNicknameAndIsAuthenticatedTrue(nickname: String): UserEntity?
    
    fun findByNicknameAndIsAuthenticatedFalse(nickname: String): UserEntity?
    
    fun findByNicknameAndIsAuthenticatedTrueAndIsActiveTrue(nickname: String): UserEntity?
    
    fun findByNicknameAndIsAuthenticatedFalseAndIsActiveTrue(nickname: String): UserEntity?
    
    fun findByNicknameAndIsAuthenticatedFalseAndHasTokenIssuedTrue(nickname: String): UserEntity?

    // Statistics-related queries
    @Query("""
        SELECT COUNT(DISTINCT u.id)
        FROM UserEntity u
        WHERE u.modifiedAt >= :since
        AND u.isActive = true
    """)
    fun countActiveUsersSince(@Param("since") since: java.time.LocalDateTime): Long
    
    @Query("""
        SELECT COUNT(u.id)
        FROM UserEntity u
        WHERE u.createdAt >= :thirtyDaysAgo
    """)
    fun countNewUsersInLast30Days(@Param("thirtyDaysAgo") thirtyDaysAgo: java.time.LocalDateTime = java.time.LocalDateTime.now().minusDays(30)): Long
    
    @Query("""
        SELECT COUNT(DISTINCT u.id)
        FROM UserEntity u
        WHERE u.createdAt <= :daysAgo
        AND u.modifiedAt >= :daysAgo
    """)
    fun countReturnedUsersAfterDays(@Param("daysAgo") daysAgo: java.time.LocalDateTime): Long
    
    @Query("""
        SELECT u
        FROM UserEntity u 
        WHERE u.createdAt >= :startDate AND u.createdAt <= :endDate
        ORDER BY u.createdAt
    """)
    fun getUsersByDateRange(
        @Param("startDate") startDate: java.time.LocalDateTime,
        @Param("endDate") endDate: java.time.LocalDateTime
    ): List<UserEntity>
    
    @Query("""
        SELECT new org.example.kotlin_liargame.domain.statistics.repository.PlayerGrowthStatInfo(
            :date,
            COUNT(DISTINCT u.id),
            COUNT(DISTINCT u.id),
            0L
        )
        FROM UserEntity u 
        WHERE u.createdAt >= :startDate AND u.createdAt <= :endDate
    """)
    fun getPlayerGrowthStats(
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate,
        @Param("date") date: java.time.LocalDateTime = java.time.LocalDateTime.now()
    ): List<PlayerGrowthStatInfo>

}