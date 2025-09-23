package org.example.kotlin_liargame.domain.game.repository

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.statistics.repository.LiarStatsInfo
import org.example.kotlin_liargame.domain.statistics.repository.PlayerStatsInfo
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface PlayerRepository : JpaRepository<PlayerEntity, Long> {
    
    fun findByGame(game: GameEntity): List<PlayerEntity>
    
    // Optimized query with JOIN FETCH to avoid N+1 problem
    @Query("SELECT p FROM PlayerEntity p LEFT JOIN FETCH p.subject WHERE p.game = :game")
    fun findByGameWithSubject(@Param("game") game: GameEntity): List<PlayerEntity>
    
    fun findByGameAndUserId(game: GameEntity, userId: Long): PlayerEntity?
    
    // Optimized query with JOIN FETCH for single player
    @Query("SELECT p FROM PlayerEntity p LEFT JOIN FETCH p.subject WHERE p.game = :game AND p.userId = :userId")
    fun findByGameAndUserIdWithSubject(@Param("game") game: GameEntity, @Param("userId") userId: Long): PlayerEntity?
    
    fun findByNickname(nickname: String): PlayerEntity?

    fun countByGame(game: GameEntity): Int
    
    fun findByGameAndIsAlive(game: GameEntity, isAlive: Boolean): List<PlayerEntity>

    @Query("SELECT COUNT(p) FROM PlayerEntity p WHERE p.game.id = :gameId")
    fun countByGameId(gameId: Long): Int

    @Query("DELETE FROM PlayerEntity p WHERE p.game.id = :gameId AND p.userId = :userId")
    @Modifying
    fun deleteByGameIdAndUserId(gameId: Long, userId: Long): Int

    @Query("SELECT p FROM PlayerEntity p WHERE p.userId = :userId AND p.game.gameState = 'IN_PROGRESS'")
    fun findByUserIdAndGameInProgress(userId: Long): PlayerEntity?

    @Query("SELECT p FROM PlayerEntity p WHERE p.userId = :userId AND p.game.gameState IN ('WAITING', 'IN_PROGRESS')")
    fun findByUserIdAndGameActive(userId: Long): PlayerEntity?

    @Query("SELECT COUNT(p) FROM PlayerEntity p WHERE p.userId = :userId AND p.game.gameState IN ('WAITING', 'IN_PROGRESS')")
    fun countByUserIdAndGameActive(userId: Long): Long

    // 플레이어 상태별 조회 및 개수
    fun findByState(state: org.example.kotlin_liargame.domain.game.model.enum.PlayerState): List<PlayerEntity>

    fun countByState(state: org.example.kotlin_liargame.domain.game.model.enum.PlayerState): Long

    fun countByStateNot(state: org.example.kotlin_liargame.domain.game.model.enum.PlayerState): Long

    // 게임별 플레이어 삭제
    @Query("DELETE FROM PlayerEntity p WHERE p.game = :game")
    @Modifying
    fun deleteByGame(game: GameEntity): Int
    
    // Statistics-related queries
    // Simplified version without complex EXTRACT functions
    @Query("""
        SELECT COUNT(p.id),
               SUM(CASE WHEN p.game.gameState = 'ENDED' AND p.role = 'CITIZEN' AND p.isAlive = true THEN 1 
                        WHEN p.game.gameState = 'ENDED' AND p.role = 'LIAR' AND p.isAlive = false THEN 1 
                        ELSE 0 END),
               COALESCE(SUM(p.cumulativeScore), 0),
               0L,
               0.0,
               MIN(p.joinedAt),
               MAX(p.joinedAt)
        FROM PlayerEntity p 
        WHERE p.userId = :userId
    """)
    fun getPlayerStatisticsRaw(@Param("userId") userId: Long): List<Array<Any>>
    
    // Keep a simpler version for backward compatibility
    @Query("""
        SELECT COUNT(p.id)
        FROM PlayerEntity p 
        WHERE p.userId = :userId
    """)
    fun getPlayerGamesCount(@Param("userId") userId: Long): Long
    
    @Query("""
        SELECT new org.example.kotlin_liargame.domain.statistics.repository.LiarStatsInfo(
            SUM(CASE WHEN p.role = 'LIAR' THEN 1 ELSE 0 END),
            SUM(CASE WHEN p.role = 'LIAR' AND p.isAlive = false THEN 1 ELSE 0 END)
        )
        FROM PlayerEntity p 
        WHERE p.userId = :userId
    """)
    fun getLiarStatistics(@Param("userId") userId: Long): LiarStatsInfo
    
    @Query("""
        SELECT s.content
        FROM PlayerEntity p
        JOIN p.subject s
        WHERE p.userId = :userId
        GROUP BY s.id, s.content
        ORDER BY COUNT(s.id) DESC
    """)
    fun getFavoriteSubjects(@Param("userId") userId: Long): List<String>
    
    @Query("""
        SELECT COUNT(p2.userId) + 1
        FROM PlayerEntity p1, PlayerEntity p2
        WHERE p1.userId = :userId
        AND p2.cumulativeScore > (SELECT SUM(px.cumulativeScore) FROM PlayerEntity px WHERE px.userId = :userId)
    """)
    fun getPlayerRank(@Param("userId") userId: Long): Long
    
    @Query("""
        SELECT p.userId
        FROM PlayerEntity p
        GROUP BY p.userId
        ORDER BY SUM(p.cumulativeScore) DESC
    """)
    fun getTopPlayersByScore(limit: Int): List<Long>
    
    @Query("""
        SELECT COALESCE(MAX(consecutive_wins), 0)
        FROM (
            SELECT COUNT(*) as consecutive_wins
            FROM PlayerEntity p
            WHERE p.userId = :userId
              AND ((p.role = 'CITIZEN' AND p.isAlive = true) OR (p.role = 'LIAR' AND p.isAlive = false))
        ) win_streaks
    """)
    fun getPlayerWinStreak(@Param("userId") userId: Long): Long
    
    @Query("""
        SELECT new org.example.kotlin_liargame.domain.statistics.repository.PlayerStatsInfo(
            COUNT(p.id),
            SUM(CASE WHEN p.game.gameState = 'ENDED' AND p.role = 'CITIZEN' AND p.isAlive = true THEN 1 
                     WHEN p.game.gameState = 'ENDED' AND p.role = 'LIAR' AND p.isAlive = false THEN 1 
                     ELSE 0 END),
            COALESCE(SUM(p.cumulativeScore), 0),
            0L,
            0.0,
            MIN(p.joinedAt),
            MAX(p.joinedAt)
        )
        FROM PlayerEntity p 
        WHERE p.userId = :userId
    """)
    fun getPlayerStatistics(@Param("userId") userId: Long): PlayerStatsInfo
}