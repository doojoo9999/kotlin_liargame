package org.example.dnf_raid.model

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "dnf_stat_history")
@EntityListeners(AuditingEntityListener::class)
class DnfStatHistoryEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    var participant: DnfParticipantEntity,

    @Column(nullable = false)
    var damage: Long = 0,

    @Column(name = "buff_power", nullable = false)
    var buffPower: Long = 0
) {
    @Id
    @GeneratedValue
    var id: UUID? = null

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime? = null
}
