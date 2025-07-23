package org.example.kotlin_liargame.domain.user.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.global.base.BaseEntity

@Entity
@Table(name = "users")
class UserEntity (

    val nickname : String,
    val profileImgUrl : String,

) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}