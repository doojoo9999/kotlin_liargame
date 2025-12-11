package org.example.dnf_raid.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Lob
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "dnf_character_loadouts")
class DnfCharacterLoadoutEntity(
    @Id
    @Column(name = "character_id", length = 80)
    val characterId: String,

    @Column(name = "server_id", length = 40, nullable = false)
    var serverId: String,

    @Lob
    @Column(name = "timeline_json", columnDefinition = "TEXT")
    var timelineJson: String? = null,

    @Lob
    @Column(name = "status_json", columnDefinition = "TEXT")
    var statusJson: String? = null,

    @Lob
    @Column(name = "equipment_json", columnDefinition = "TEXT")
    var equipmentJson: String? = null,

    @Lob
    @Column(name = "avatar_json", columnDefinition = "TEXT")
    var avatarJson: String? = null,

    @Lob
    @Column(name = "creature_json", columnDefinition = "TEXT")
    var creatureJson: String? = null,

    @Lob
    @Column(name = "flag_json", columnDefinition = "TEXT")
    var flagJson: String? = null,

    @Lob
    @Column(name = "mist_assimilation_json", columnDefinition = "TEXT")
    var mistAssimilationJson: String? = null,

    @Lob
    @Column(name = "skill_style_json", columnDefinition = "TEXT")
    var skillStyleJson: String? = null,

    @Lob
    @Column(name = "buff_equipment_json", columnDefinition = "TEXT")
    var buffEquipmentJson: String? = null,

    @Lob
    @Column(name = "buff_avatar_json", columnDefinition = "TEXT")
    var buffAvatarJson: String? = null,

    @Lob
    @Column(name = "buff_creature_json", columnDefinition = "TEXT")
    var buffCreatureJson: String? = null,

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
