package org.example.kotlin_liargame.domain.game.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
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
    var gameOwner: String,
    var gameEndTime: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_subject_id")
    var citizenSubject: SubjectEntity? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "liar_subject_id")
    var liarSubject: SubjectEntity? = null
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
    
    fun startGame() {
        if (gameState == GameState.WAITING) {
            gameState = GameState.IN_PROGRESS
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
    
    fun canStart(currentPlayerCount: Int): Boolean {
        return currentPlayerCount >= 3 && currentPlayerCount <= 15
    }
}
