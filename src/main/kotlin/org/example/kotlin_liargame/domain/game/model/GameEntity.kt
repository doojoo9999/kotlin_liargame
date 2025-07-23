package org.example.kotlin_liargame.domain.game.model

import jakarta.persistence.*
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "game")
class GameEntity(

    val gNumber: Int,
    val gName: String,
    val gPassword: String?,
    val gParticipants: Int,
    val gRound: Int,
    val gStatus: Boolean,
    val gOwner: String

) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}