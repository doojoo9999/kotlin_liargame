package org.example.kotlin_liargame.domain.user.model

import jakarta.persistence.*
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "users")
class UserEntity (

    val nickname : String,
    val profileImgUrl : String,
    var isActive : Boolean = true,
    var isAuthenticated : Boolean = false,
    var hasTokenIssued : Boolean = false

) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    fun toUnActive() {
        this.isActive = false
    }

    fun toActive() {
        this.isActive = true
    }

    fun setTokenIssued() {
        this.hasTokenIssued = true
    }

}