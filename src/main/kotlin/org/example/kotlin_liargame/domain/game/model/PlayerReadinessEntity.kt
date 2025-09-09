package org.example.kotlin_liargame.domain.game.model

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "player_readiness")
data class PlayerReadinessEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    val game: GameEntity,

    @Column(name = "user_id", nullable = false)
    val userId: Long,

    @Column(name = "nickname", nullable = false)
    val nickname: String,

    @Column(name = "is_ready", nullable = false)
    var isReady: Boolean = false,

    @Column(name = "ready_at")
    var readyAt: Instant? = null,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)

