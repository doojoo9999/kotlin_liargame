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

    fun existsByGameNumber(gameNumber: Int): Boolean
    
    // Optimized query with JOIN FETCH to avoid N+1 problem
    @Query("SELECT g FROM GameEntity g LEFT JOIN FETCH g.citizenSubject LEFT JOIN FETCH g.liarSubject WHERE g.gameNumber = :gameNumber")
    fun findByGameNumberWithSubjects(@Param("gameNumber") gameNumber: Int): GameEntity?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT g FROM GameEntity g WHERE g.gameNumber = :gameNumber")
    fun findByGameNumberWithLock(gameNumber: Int): GameEntity?

    @Query("SELECT g FROM GameEntity g WHERE g.gameState != :gameState")
    fun findByGameStateNot(gameState: GameState): List<GameEntity>

    @Query("SELECT g FROM GameEntity g WHERE g.gameState IN ('WAITING', 'IN_PROGRESS')")
    fun findAllActiveGames(): List<GameEntity>

    @Query("SELECT g.gameNumber FROM GameEntity g")
    fun findAllGameNumbers(): List<Int>

    @Query(
        """
        SELECT g
        FROM GameEntity g
        WHERE g.gameState IN ('WAITING', 'IN_PROGRESS')
          AND EXISTS (
              SELECT 1 FROM PlayerEntity p WHERE p.game = g
          )
          AND NOT EXISTS (
              SELECT 1 FROM PlayerEntity p WHERE p.game = g AND p.isOnline = true
          )
        """
    )
    fun findActiveGamesWithAllPlayersOffline(): List<GameEntity>

    fun findByGameState(gameState: GameState): List<GameEntity>

    @Query("SELECT g FROM GameEntity g WHERE g.gameState = 'WAITING' AND g.createdAt < :time")
    fun findStaleWaitingGames(time: java.time.LocalDateTime): List<GameEntity>

    fun findByGameOwnerAndGameStateIn(owner: String, states: List<GameState>): GameEntity?

    // 게임 상태별 개수 조회
    fun countByGameState(gameState: GameState): Long

    // 시간 기반 오래된 게임 조회
    fun findByGameStateAndCreatedAtBefore(gameState: GameState, time: java.time.LocalDateTime): List<GameEntity>

    fun findByGameStateAndModifiedAtBefore(gameState: GameState, time: java.time.LocalDateTime): List<GameEntity>
    
    // Statistics-related queries
    @Query("""
        SELECT g 
        FROM GameEntity g 
        WHERE g.gameState = 'ENDED' 
        AND g.modifiedAt IS NOT NULL
        ORDER BY g.createdAt DESC
    """)
    fun findCompletedGames(): List<GameEntity>
    
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
    fun getPeakConcurrentGames(@Param("since") since: java.time.LocalDateTime = java.time.LocalDateTime.now().minusDays(1)): Long
    
    @Query("""
        SELECT COUNT(g.id)
        FROM GameEntity g 
        WHERE g.gameState = 'ENDED' 
        AND g.modifiedAt IS NOT NULL
    """)
    fun getTotalCompletedGames(): Long
    
    // Statistics methods - simplified implementation to avoid HQL/SQL compatibility issues
    // Complex date calculations moved to service layer
    
    @Query("""
        SELECT g
        FROM GameEntity g
        WHERE g.createdAt >= :startDate AND g.createdAt <= :endDate
        ORDER BY g.createdAt
    """)
    fun findGamesByDateRange(
        @Param("startDate") startDate: java.time.LocalDateTime,
        @Param("endDate") endDate: java.time.LocalDateTime
    ): List<GameEntity>
    
    @Query("""
        SELECT g
        FROM GameEntity g 
        WHERE g.createdAt >= :since
        ORDER BY g.createdAt DESC
    """)
    fun findGamesSince(@Param("since") since: java.time.LocalDateTime): List<GameEntity>
    
    @Query("""
        SELECT COUNT(g.id)
        FROM GameEntity g 
        WHERE g.gameState = 'ENDED' 
        AND g.modifiedAt IS NOT NULL
        AND g.createdAt >= :since
    """)
    fun countCompletedGamesSince(@Param("since") since: java.time.LocalDateTime): Long
    
}
