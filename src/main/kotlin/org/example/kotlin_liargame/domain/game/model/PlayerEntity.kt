package org.example.kotlin_liargame.domain.game.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.game.model.enum.PlayerRole
import org.example.kotlin_liargame.domain.game.model.enum.PlayerState
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import java.time.Instant

@Entity
@Table(name = "player")
class PlayerEntity (
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    val game: GameEntity,

    @Column(nullable = false)
    val userId: Long,

    @Column(nullable = false)
    val nickname: String,

    @Column(nullable = false)
    var isAlive: Boolean = true,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val role: PlayerRole,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    val subject: SubjectEntity,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var state: PlayerState = PlayerState.WAITING_FOR_HINT,

    @Column(nullable = false)
    var votesReceived: Int = 0,

    @Column(nullable = true)
    var hint: String? = null,

    @Column(nullable = true)
    var defense: String? = null,

    @Column(nullable = true)
    var votedFor: Long? = null,

    @Column(nullable = true)
    var voteStartTime: Instant? = null
){
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    fun giveHint(hint: String) {
        this.hint = hint
        this.state = PlayerState.GAVE_HINT
    }

    fun voteFor(playerId: Long) {
        this.votedFor = playerId
        this.state = PlayerState.VOTED
    }

    fun receiveVote() {
        this.votesReceived++
    }

    fun resetVotes() {
        this.votesReceived = 0
        this.votedFor = null
    }

    fun accuse() {
        this.state = PlayerState.ACCUSED
    }

    fun defend(defense: String) {
        this.defense = defense
        this.state = PlayerState.DEFENDED
    }

    fun survive() {
        this.state = PlayerState.SURVIVED
    }

    fun eliminate() {
        this.isAlive = false
        this.state = PlayerState.ELIMINATED
    }

    fun resetForNewRound() {
        this.state = PlayerState.WAITING_FOR_HINT
        this.hint = null
        this.defense = null
        this.votesReceived = 0
        this.votedFor = null
        this.voteStartTime = null
    }

    fun setWaitingForVote() {
        this.state = PlayerState.WAITING_FOR_VOTE
        this.voteStartTime = Instant.now()
    }

    fun hasVotingTimeExpired(): Boolean {
        val startTime = this.voteStartTime ?: return false
        val currentTime = Instant.now()
        return currentTime.isAfter(startTime.plusSeconds(30))
    }
}
