package org.example.dnf_raid.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Lob
import jakarta.persistence.Table

@Entity
@Table(name = "dnf_raw_skills")
data class DnfSkillEntity(
    @Id
    @Column(name = "id", length = 128)
    val id: String, // composed: jobGrowId:skillId

    @Column(name = "job_id", length = 64, nullable = false)
    val jobId: String,

    @Column(name = "job_grow_id", length = 64, nullable = false)
    val jobGrowId: String,

    @Column(name = "job_name", length = 128, nullable = false)
    val jobName: String,

    @Column(name = "job_grow_name", length = 128, nullable = false)
    val jobGrowName: String,

    @Column(name = "skill_id", length = 64, nullable = false)
    val skillId: String,

    @Column(name = "skill_name", length = 256, nullable = false)
    val skillName: String,

    @Column(name = "skill_type", length = 64)
    val skillType: String? = null,

    @Lob
    @Column(name = "skill_desc", columnDefinition = "TEXT")
    val skillDesc: String? = null,

    @Lob
    @Column(name = "skill_desc_detail", columnDefinition = "TEXT")
    val skillDescDetail: String? = null,

    @Lob
    @Column(name = "desc_special_json", columnDefinition = "TEXT")
    val descSpecialJson: String? = null,

    @Lob
    @Column(name = "consume_item_json", columnDefinition = "TEXT")
    val consumeItemJson: String? = null,

    @Column(name = "max_level")
    val maxLevel: Int? = null,

    @Column(name = "required_level")
    val requiredLevel: Int? = null,

    @Column(name = "base_cool_time")
    val baseCoolTime: Double? = null,

    @Column(name = "option_desc", length = 2048)
    val optionDesc: String? = null,

    @Lob
    @Column(name = "level_info_json", columnDefinition = "TEXT")
    val levelInfoJson: String? = null,

    @Lob
    @Column(name = "detail_json", columnDefinition = "TEXT")
    val detailJson: String? = null,

    @Lob
    @Column(name = "enhancement_json", columnDefinition = "TEXT")
    val enhancementJson: String? = null,

    @Lob
    @Column(name = "evolution_json", columnDefinition = "TEXT")
    val evolutionJson: String? = null,

    @Lob
    @Column(name = "level_rows_json", columnDefinition = "TEXT")
    val levelRowsJson: String? = null
)
