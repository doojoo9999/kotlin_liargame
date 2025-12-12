package org.example.dnf_raid.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Lob
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "dnf_calculated_damages")
data class DnfCalculatedDamageEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "character_id", length = 80, nullable = false)
    var characterId: String,

    @Column(name = "server_id", length = 40, nullable = false)
    var serverId: String,

    @Column(name = "dealer_score")
    var dealerScore: Double? = null,

    @Column(name = "buffer_score")
    var bufferScore: Double? = null,

    @Lob
    @Column(name = "calc_json", columnDefinition = "TEXT")
    var calcJson: String? = null,

    @Column(name = "calculated_at")
    var calculatedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
