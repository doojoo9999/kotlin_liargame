package org.example.kotlin_liargame.domain.game.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.game.model.enum.ActionType
import org.example.kotlin_liargame.global.base.BaseEntity
import java.time.LocalDateTime

@Entity
@Table(name = "player_actions")
class PlayerActionEntity(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_history_id", nullable = false)
    val gameHistory: GameHistorySummaryEntity,

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
