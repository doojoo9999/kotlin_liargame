package org.example.kotlin_liargame.domain.game.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "game")
class GameEntity(
    val gNumber: Int,
    val gName: String,
    val gPassword: String?,
    val gParticipants: Int,
    val gTotalRounds: Int,
    var gCurrentRound: Int = 0,
    val gLiarCount: Int = 1,
    val gGameMode: GameMode = GameMode.LIARS_KNOW,
    var gState: GameState = GameState.WAITING,
    var gOwner: String,

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
        if (gState == GameState.WAITING) {
            gState = GameState.IN_PROGRESS
            gCurrentRound = 1
        }
    }
    
    fun nextRound(): Boolean {
        if (gState == GameState.IN_PROGRESS && gCurrentRound < gTotalRounds) {
            gCurrentRound++
            return true
        }
        return false
    }
    
    fun endGame() {
        gState = GameState.ENDED
    }
    
    fun isFull(currentPlayerCount: Int): Boolean {
        return currentPlayerCount >= gParticipants
    }
    
    fun canStart(currentPlayerCount: Int): Boolean {
        return currentPlayerCount >= 3 && currentPlayerCount <= 15
    }
}
