package org.example.kotlin_liargame.global.connection.repository

import org.example.kotlin_liargame.global.connection.model.ConnectionLogEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface ConnectionLogRepository : JpaRepository<ConnectionLogEntity, Long> {
    fun findTopByUserIdOrderByTimestampDesc(userId: Long): ConnectionLogEntity?

    fun findByUserIdAndTimestampAfter(userId: Long, timestamp: java.time.Instant): List<ConnectionLogEntity>

    @Query("SELECT cl FROM ConnectionLogEntity cl WHERE cl.gameId = :gameId AND cl.userId = :userId ORDER BY cl.timestamp DESC")
    fun findByGameIdAndUserIdOrderByTimestampDesc(gameId: Long, userId: Long): List<ConnectionLogEntity>
}

