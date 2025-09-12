package org.example.kotlin_liargame.domain.user.repository

import org.example.kotlin_liargame.domain.statistics.repository.PlayerGrowthStatInfo
import org.example.kotlin_liargame.domain.user.model.UserEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant
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
    fun countActiveUsersSince(@Param("since") since: Instant): Long
    
    @Query("""
        SELECT COUNT(u.id)
        FROM UserEntity u
        WHERE u.createdAt >= :thirtyDaysAgo
    """)
    fun countNewUsersInLast30Days(@Param("thirtyDaysAgo") thirtyDaysAgo: Instant = Instant.now().minus(30 * 24 * 60 * 60, java.time.temporal.ChronoUnit.SECONDS)): Long
    
    @Query("""
        SELECT COUNT(DISTINCT u.id)
        FROM UserEntity u
        WHERE u.createdAt <= :daysAgo
        AND u.modifiedAt >= :daysAgo
    """)
    fun countReturnedUsersAfterDays(@Param("daysAgo") daysAgo: Instant): Long
    
    @Query("""
        SELECT new org.example.kotlin_liargame.domain.statistics.repository.PlayerGrowthStatInfo(
            CAST(u.createdAt AS LocalDate),
            COUNT(DISTINCT CASE WHEN CAST(u.createdAt AS LocalDate) = CAST(:date AS LocalDate) THEN u.id END),
            COUNT(DISTINCT CASE WHEN u.modifiedAt >= :date THEN u.id END),
            COUNT(DISTINCT CASE WHEN u.modifiedAt >= :date AND CAST(u.createdAt AS LocalDate) < CAST(:date AS LocalDate) THEN u.id END)
        )
        FROM UserEntity u 
        WHERE CAST(u.createdAt AS LocalDate) BETWEEN :startDate AND :endDate
        GROUP BY CAST(u.createdAt AS LocalDate)
        ORDER BY CAST(u.createdAt AS LocalDate)
    """)
    fun getPlayerGrowthStats(
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate,
        @Param("date") date: Instant = Instant.now()
    ): List<PlayerGrowthStatInfo>

}