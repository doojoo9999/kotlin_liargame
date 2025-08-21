package org.example.kotlin_liargame.domain.user.model

import jakarta.persistence.*
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "users")
class UserEntity (

    val nickname : String,
    val profileImgUrl : String,
    var isActive : Boolean = true,
    var isAuthenticated : Boolean = false,
    var hasTokenIssued : Boolean = false,
    var password : String? = null,
    
    @Column(name = "total_games", nullable = false)
    var totalGames: Int = 0,
    
    @Column(name = "total_wins", nullable = false)
    var totalWins: Int = 0,
    
    @Column(name = "total_losses", nullable = false)
    var totalLosses: Int = 0,
    
    @Column(name = "liar_games", nullable = false)
    var liarGames: Int = 0,
    
    @Column(name = "liar_wins", nullable = false)
    var liarWins: Int = 0,
    
    @Column(name = "citizen_games", nullable = false)
    var citizenGames: Int = 0,
    
    @Column(name = "citizen_wins", nullable = false)
    var citizenWins: Int = 0,
    
    @Column(name = "ranking_points", nullable = false)
    var rankingPoints: Int = 1000, // 초기 점수 1000점
    
    @Column(name = "highest_ranking_points", nullable = false)
    var highestRankingPoints: Int = 1000,
    
    @Column(name = "total_playtime_seconds", nullable = false)
    var totalPlaytimeSeconds: Long = 0

) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    fun toUnActive() {
        this.isActive = false
    }

    fun toActive() {
        this.isActive = true
    }

    fun setTokenIssued() {
        this.hasTokenIssued = true
    }
    
    fun getWinRate(): Double {
        return if (totalGames > 0) (totalWins.toDouble() / totalGames.toDouble()) * 100 else 0.0
    }
    
    fun getLiarSuccessRate(): Double {
        return if (liarGames > 0) (liarWins.toDouble() / liarGames.toDouble()) * 100 else 0.0
    }
    
    fun getCitizenSuccessRate(): Double {
        return if (citizenGames > 0) (citizenWins.toDouble() / citizenGames.toDouble()) * 100 else 0.0
    }
    
    fun updateGameResult(isWin: Boolean, isLiar: Boolean, gameDurationSeconds: Long, pointsChange: Int) {
        totalGames++
        totalPlaytimeSeconds += gameDurationSeconds
        
        if (isWin) {
            totalWins++
        } else {
            totalLosses++
        }
        
        if (isLiar) {
            liarGames++
            if (isWin) {
                liarWins++
            }
        } else {
            citizenGames++
            if (isWin) {
                citizenWins++
            }
        }
        
        rankingPoints += pointsChange
        if (rankingPoints < 0) {
            rankingPoints = 0
        }
        
        if (rankingPoints > highestRankingPoints) {
            highestRankingPoints = rankingPoints
        }
    }
    
    fun getRank(): String {
        return when {
            rankingPoints >= 2000 -> "Diamond"
            rankingPoints >= 1700 -> "Platinum"
            rankingPoints >= 1400 -> "Gold"
            rankingPoints >= 1100 -> "Silver"
            else -> "Bronze"
        }
    }

}
