package org.example.dnf_raid.model

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "dnf_participants")
@EntityListeners(AuditingEntityListener::class)
class DnfParticipantEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raid_id", nullable = false)
    var raid: DnfRaidEntity,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id", nullable = false)
    var character: DnfCharacterEntity,

    @Column(nullable = false)
    var damage: Long = 0,

    @Column(name = "buff_power", nullable = false)
    var buffPower: Long = 0,

    @Column(name = "party_number")
    var partyNumber: Int? = null,

    @Column(name = "slot_index")
    var slotIndex: Int? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "cohort_preference", length = 16)
    var cohortPreference: CohortPreference? = null
) {
    @Id
    @GeneratedValue
    var id: UUID? = null

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime? = null
}
