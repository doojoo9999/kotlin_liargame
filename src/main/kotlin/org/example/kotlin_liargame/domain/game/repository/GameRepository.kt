package org.example.kotlin_liargame.domain.game.repository

import jakarta.persistence.LockModeType
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface GameRepository : JpaRepository<GameEntity, Long> {

    fun findByGameOwner(gameOwner: String) : GameEntity?
    
    @Query("SELECT g FROM GameEntity g WHERE g.gameNumber = :gameNumber")
    fun findByGameNumber(gameNumber: Int) : GameEntity?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT g FROM GameEntity g WHERE g.gameNumber = :gameNumber")
    fun findByGameNumberWithLock(gameNumber: Int): GameEntity?

    @Query("SELECT g FROM GameEntity g WHERE g.gameState != :gameState")
    fun findByGameStateNot(gameState: GameState): List<GameEntity>

    @Query("SELECT g FROM GameEntity g WHERE g.gameState IN ('WAITING', 'IN_PROGRESS')")
    fun findAllActiveGames(): List<GameEntity>

    fun findByGameState(gameState: GameState): List<GameEntity>

    @Query("SELECT g FROM GameEntity g WHERE g.gameState = 'WAITING' AND g.createdAt < :time")
    fun findStaleWaitingGames(time: java.time.Instant): List<GameEntity>

    fun findByGameOwnerAndGameStateIn(owner: String, states: List<GameState>): GameEntity?

    // 게임 상태별 개수 조회
    fun countByGameState(gameState: GameState): Long

    // 시간 기반 오래된 게임 조회
    fun findByGameStateAndCreatedAtBefore(gameState: GameState, time: java.time.Instant): List<GameEntity>

    fun findByGameStateAndModifiedAtBefore(gameState: GameState, time: java.time.Instant): List<GameEntity>
    
    // Statistics-related queries
    @Query("""
        SELECT new org.example.kotlin_liargame.domain.statistics.repository.GameDurationInfo(
            g.id, 
            EXTRACT(EPOCH FROM (g.modifiedAt - g.createdAt)) / 60
        )
        FROM GameEntity g 
        WHERE g.gameState = 'ENDED' 
        AND g.modifiedAt IS NOT NULL
        ORDER BY g.createdAt DESC
    """)
    fun findCompletedGamesWithDuration(): List<org.example.kotlin_liargame.domain.statistics.repository.GameDurationInfo>
    
    @Query("""
        SELECT new org.example.kotlin_liargame.domain.statistics.repository.SubjectPopularityInfo(
            s.content,
            COUNT(gs.id),
            0.0,
            'General'
        )
        FROM org.example.kotlin_liargame.domain.subject.model.SubjectEntity s 
        JOIN org.example.kotlin_liargame.domain.game.model.GameSubjectEntity gs ON s.id = gs.subject.id
        GROUP BY s.id, s.content
        ORDER BY COUNT(gs.id) DESC
    """)
    fun getPopularSubjects(@Param("limit") limit: Int): List<org.example.kotlin_liargame.domain.statistics.repository.SubjectPopularityInfo>
    
    @Query("""
        SELECT COUNT(DISTINCT g.id)
        FROM GameEntity g
        WHERE g.gameState = 'IN_PROGRESS'
        AND g.createdAt >= :since
    """)
    fun getPeakConcurrentGames(@Param("since") since: java.time.Instant = java.time.Instant.now().minusSeconds(86400)): Long
    
    @Query("""
        SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (g.modifiedAt - g.createdAt)) / 60), 0)
        FROM GameEntity g 
        WHERE g.gameState = 'ENDED' 
        AND g.modifiedAt IS NOT NULL
    """)
    fun getTotalGameTimeInMinutes(): Long
    
    @Query("""
        SELECT new org.example.kotlin_liargame.domain.statistics.repository.DailyGameStatInfo(
            CAST(g.createdAt AS LocalDate),
            COUNT(g.id),
            COUNT(DISTINCT p.userId),
            AVG(EXTRACT(EPOCH FROM (g.modifiedAt - g.createdAt)) / 60)
        )
        FROM GameEntity g
        LEFT JOIN PlayerEntity p ON g.id = p.game.id
        WHERE CAST(g.createdAt AS LocalDate) BETWEEN :startDate AND :endDate
        GROUP BY CAST(g.createdAt AS LocalDate)
        ORDER BY CAST(g.createdAt AS LocalDate)
    """)
    fun getDailyGameStats(
        @Param("startDate") startDate: java.time.LocalDate,
        @Param("endDate") endDate: java.time.LocalDate
    ): List<org.example.kotlin_liargame.domain.statistics.repository.DailyGameStatInfo>
    
    @Query("""
        SELECT EXTRACT(HOUR FROM g.createdAt) as hour, COUNT(g.id) as count
        FROM GameEntity g 
        WHERE g.createdAt >= :since
        GROUP BY EXTRACT(HOUR FROM g.createdAt)
        ORDER BY hour
    """)
    fun getHourlyGameDistribution(@Param("since") since: java.time.Instant = java.time.Instant.now().minusSeconds(30 * 24 * 60 * 60)): Map<Int, Long>
    
    @Query("""
        SELECT 
            CASE EXTRACT(DOW FROM g.createdAt)
                WHEN 0 THEN 'Sunday'
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
            END as dayOfWeek,
            COUNT(g.id) as count
        FROM GameEntity g 
        WHERE g.createdAt >= :since
        GROUP BY EXTRACT(DOW FROM g.createdAt)
        ORDER BY EXTRACT(DOW FROM g.createdAt)
    """)
    fun getDayOfWeekDistribution(@Param("since") since: java.time.Instant = java.time.Instant.now().minusSeconds(30 * 24 * 60 * 60)): Map<String, Long>
    
    @Query("""
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (g.modifiedAt - g.createdAt)) / 60), 0)
        FROM GameEntity g 
        WHERE g.gameState = 'ENDED' 
        AND g.modifiedAt IS NOT NULL
        AND g.createdAt >= :since
    """)
    fun getAverageSessionLength(@Param("since") since: java.time.Instant = java.time.Instant.now().minusSeconds(30 * 24 * 60 * 60)): Double
}