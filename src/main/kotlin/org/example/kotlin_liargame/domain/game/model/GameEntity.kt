package org.example.kotlin_liargame.domain.game.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.global.base.BaseEntity
import java.time.Instant

@Entity
@Table(name = "game")
class GameEntity(
    val gameNumber: Int,
    val gameName: String,
    val gamePassword: String?,
    val gameParticipants: Int,
    val gameTotalRounds: Int,
    var gameCurrentRound: Int = 0,
    val gameLiarCount: Int = 1,
    @Column(name = "g_game_mode")
    @Enumerated(EnumType.STRING)
    val gameMode: GameMode = GameMode.LIARS_KNOW,
    @Column(name = "g_state")
    @Enumerated(EnumType.STRING)
    var gameState: GameState = GameState.WAITING,
    @Column(name = "g_phase")
    @Enumerated(EnumType.STRING)
    var currentPhase: GamePhase = GamePhase.WAITING_FOR_PLAYERS,
    var gameOwner: String,
    var gameEndTime: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_subject_id")
    var citizenSubject: SubjectEntity? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "liar_subject_id")
    var liarSubject: SubjectEntity? = null,

    var currentPlayerId: Long? = null,
    var accusedPlayerId: Long? = null,
    var turnStartedAt: Instant? = null,

    @Column(columnDefinition = "TEXT")
    var turnOrder: String? = null,
    var currentTurnIndex: Int = 0,
    var phaseEndTime: Instant? = null,

    // 게임 시작 시간 연장을 위한 필드
    var gameStartDeadline: Instant? = null,

    // 마지막 활동 시간 (채팅, 게임 액션 등)
    var lastActivityAt: Instant? = null,

    @Column(nullable = true)
    var timeExtensionCount: Int? = null,

    // 목표 점수 (점수 기반 승리 조건)
    @Column(nullable = false)
    val targetPoints: Int = 10
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    @Version
    val version: Long = 0
    
    fun startGame() {
        if (gameState == GameState.WAITING) {
            gameState = GameState.IN_PROGRESS
            currentPhase = GamePhase.SPEECH  // GIVING_HINTS 대신 SPEECH 사용
            gameCurrentRound = 1
        }
    }

    fun nextRound(): Boolean {
        if (gameState == GameState.IN_PROGRESS && gameCurrentRound < gameTotalRounds) {
            gameCurrentRound++
            return true
        }
        return false
    }

    fun endGame() {
        gameState = GameState.ENDED
        gameEndTime = Instant.now()
    }

    fun isFull(currentPlayerCount: Int): Boolean {
        return currentPlayerCount >= gameParticipants
    }
}
