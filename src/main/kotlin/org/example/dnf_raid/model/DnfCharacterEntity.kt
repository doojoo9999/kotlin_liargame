package org.example.dnf_raid.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "dnf_characters")
class DnfCharacterEntity(
    @Id
    @Column(name = "character_id", length = 80)
    val characterId: String,

    @Column(name = "server_id", nullable = false, length = 40)
    var serverId: String,

    @Column(name = "character_name", nullable = false, length = 100)
    var characterName: String,

    @Column(name = "job_name", nullable = false, length = 100)
    var jobName: String,

    @Column(name = "job_grow_name", nullable = false, length = 100)
    var jobGrowName: String,

    @Column(nullable = false)
    var fame: Int,

    @Column(nullable = false)
    var damage: Long = 0,

    @Column(name = "buff_power", nullable = false)
    var buffPower: Long = 0,

    @Column(name = "adventure_name", length = 100)
    var adventureName: String? = null,

    @Column(name = "last_updated_at")
    var lastUpdatedAt: LocalDateTime = LocalDateTime.now()
)
