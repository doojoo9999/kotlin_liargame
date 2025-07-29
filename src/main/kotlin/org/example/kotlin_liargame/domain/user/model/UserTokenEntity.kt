package org.example.kotlin_liargame.domain.user.model

import jakarta.persistence.*
import org.example.kotlin_liargame.global.base.BaseEntity
import java.time.LocalDateTime

@Entity
@Table(name = "user_tokens")
class UserTokenEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    val user: UserEntity,
    
    @Column(nullable = false, unique = true)
    val token: String,
    
    @Column(nullable = false)
    val expiresAt: LocalDateTime
) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
    
    fun isExpired(): Boolean {
        return LocalDateTime.now().isAfter(expiresAt)
    }
    
    companion object {
        fun create(user: UserEntity, token: String, expiresAt: LocalDateTime): UserTokenEntity {
            return UserTokenEntity(user, token, expiresAt)
        }
    }
}