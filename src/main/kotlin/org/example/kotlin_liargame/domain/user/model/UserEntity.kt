package org.example.kotlin_liargame.domain.user.model

import jakarta.persistence.*

@Entity
@Table(name = "users")
class UserEntity (

    val nickname : String,
    val profileImgUrl : String,

) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}