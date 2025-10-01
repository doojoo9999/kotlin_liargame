package org.example.kotlin_liargame.domain.chat.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.chat.model.enum.ChatMessageType
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
    @JoinColumn(name = "player_id", foreignKey = ForeignKey(ConstraintMode.CONSTRAINT), nullable = true)
    var player: PlayerEntity?, // 시스템 메시지의 경우 null 가능

    @Column(nullable = false)
    val content: String,

    @Column(nullable = false)
    val timestamp: Instant = Instant.now(),

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val type: ChatMessageType,

    @Column(name = "player_user_id")
    var playerUserId: Long? = player?.userId,

    @Column(name = "player_nickname_snapshot", length = 100)
    var playerNicknameSnapshot: String? = player?.nickname
) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
