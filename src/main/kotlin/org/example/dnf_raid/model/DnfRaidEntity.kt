package org.example.dnf_raid.model

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "dnf_raids")
@EntityListeners(AuditingEntityListener::class)
class DnfRaidEntity(
    @Column(name = "user_id", nullable = false, length = 64)
    var userId: String,

    /**
     * 같은 모공(그룹) 안의 기수들을 묶는 상위 ID. null이면 단일 레이드.
     */
    @Column(name = "mother_raid_id")
    var motherRaidId: UUID? = null,

    @Column(nullable = false, length = 100)
    var name: String,

    @Column(name = "password", length = 100)
    var password: String? = null,

    @Column(name = "is_public", nullable = false)
    var isPublic: Boolean = false
) {
    @Id
    @GeneratedValue
    var id: UUID? = null

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime? = null

    @OneToMany(mappedBy = "raid", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    val participants: MutableList<DnfParticipantEntity> = mutableListOf()
}
