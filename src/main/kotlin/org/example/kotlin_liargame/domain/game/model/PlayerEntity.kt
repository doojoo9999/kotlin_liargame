package org.example.kotlin_liargame.domain.game.model

import jakarta.persistence.*

@Entity
@Table(name = "player")
class PlayerEntity (
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    val game: GameEntity,

    @Column(nullable = false)
    val userId:Long,

    @Column(nullable = false)
    val nickname: String,

    @Column(nullable = false)
    val isAlive: Boolean = true,




){
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}