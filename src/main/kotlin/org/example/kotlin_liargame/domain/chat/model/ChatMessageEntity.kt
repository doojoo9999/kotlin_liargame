package org.example.kotlin_liargame.domain.chat.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.global.base.BaseEntity
import java.time.Instant

@Entity
@Table(name = "chat_message")
class ChatMessageEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    val game: GameEntity,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id")
    val player: PlayerEntity,

    @Column(nullable = false)
    val content: String,

    @Column(nullable = false)
    val timestamp: Instant = Instant.now(),

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val type: ChatMessageType
) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
