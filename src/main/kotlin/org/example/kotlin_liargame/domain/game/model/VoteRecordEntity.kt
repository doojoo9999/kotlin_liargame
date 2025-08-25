package org.example.kotlin_liargame.domain.game.model

import jakarta.persistence.*
import org.example.kotlin_liargame.global.base.BaseEntity
import java.time.LocalDateTime

@Entity
@Table(name = "vote_records")
class VoteRecordEntity(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_history_id", nullable = false)
    val gameHistory: GameHistorySummaryEntity,

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
