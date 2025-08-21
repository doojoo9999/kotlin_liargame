package org.example.kotlin_liargame.domain.profanity.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.user.model.UserEntity
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "profanity_request")
class ProfanityRequestEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, unique = true)
    val word: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suggester_id", nullable = false)
    val suggester: UserEntity,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: ProfanityRequestStatus = ProfanityRequestStatus.PENDING
) : BaseEntity()

enum class ProfanityRequestStatus {
    PENDING,
    APPROVED,
    REJECTED
}
