package org.example.kotlin_liargame.domain.game.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.game.model.enum.ActionType
import org.example.kotlin_liargame.domain.game.model.enum.GameResult
import org.example.kotlin_liargame.global.base.BaseEntity
import java.time.LocalDateTime

@Entity
@Table(name = "game_histories")
class GameHistoryEntity(

    @Column(name = "game_id", nullable = false)
    val gameId: String,

    @Column(name = "room_name", nullable = false, length = 100)
    val roomName: String,

    @Column(name = "subject", nullable = false, length = 200)
    val subject: String,

    @Column(name = "liar_word", nullable = false, length = 100)
    val liarWord: String,

    @Column(name = "correct_word", nullable = false, length = 100)
    val correctWord: String,

    @Column(name = "total_players", nullable = false)
    val totalPlayers: Int,

    @Column(name = "liar_user_id", nullable = false)
    val liarUserId: Long,

    @Column(name = "liar_nickname", nullable = false, length = 50)
    val liarNickname: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "game_result", nullable = false)
    val gameResult: GameResult,

    @Column(name = "winner_team", nullable = false, length = 20)
    val winnerTeam: String, // "LIAR" or "CITIZENS"

    @Column(name = "game_duration_seconds", nullable = false)
    val gameDurationSeconds: Long,

    @Column(name = "total_rounds", nullable = false)
    val totalRounds: Int,

    @Column(name = "started_at", nullable = false)
    val startedAt: LocalDateTime,

    @Column(name = "ended_at", nullable = false)
    val endedAt: LocalDateTime,

    @Column(name = "game_data", columnDefinition = "TEXT")
    val gameData: String? = null // JSON 형태로 상세 게임 진행 데이터 저장
    
) : BaseEntity() {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
    
    // 게임 기록과 연관된 플레이어 액션들
    @OneToMany(mappedBy = "gameHistory", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val playerActions: MutableList<PlayerActionEntity> = mutableListOf()
    
    // 게임 기록과 연관된 투표 기록들
    @OneToMany(mappedBy = "gameHistory", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val voteRecords: MutableList<VoteRecordEntity> = mutableListOf()
}

@Entity
@Table(name = "player_actions")
class PlayerActionEntity(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_history_id", nullable = false)
    val gameHistory: GameHistoryEntity,

    @Column(name = "user_id", nullable = false)
    val userId: Long,

    @Column(name = "nickname", nullable = false, length = 50)
    val nickname: String,

    @Column(name = "round_number", nullable = false)
    val roundNumber: Int,

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    val actionType: ActionType,

    @Column(name = "content", columnDefinition = "TEXT")
    val content: String? = null,

    @Column(name = "action_time", nullable = false)
    val actionTime: LocalDateTime
    
) : BaseEntity() {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}

@Entity
@Table(name = "vote_records")
class VoteRecordEntity(
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_history_id", nullable = false)
    val gameHistory: GameHistoryEntity,
    
    @Column(name = "voter_user_id", nullable = false)
    val voterUserId: Long,
    
    @Column(name = "voter_nickname", nullable = false, length = 50)
    val voterNickname: String,
    
    @Column(name = "voted_user_id", nullable = false)
    val votedUserId: Long,
    
    @Column(name = "voted_nickname", nullable = false, length = 50)
    val votedNickname: String,
    
    @Column(name = "vote_time", nullable = false)
    val voteTime: LocalDateTime
    
) : BaseEntity() {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}