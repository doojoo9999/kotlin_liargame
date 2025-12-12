package org.example.dnf_raid.repository

import org.example.dnf_raid.model.DnfSkillEntity
import org.springframework.data.jpa.repository.JpaRepository

interface DnfSkillRepository : JpaRepository<DnfSkillEntity, String> {
    fun deleteByJobGrowId(jobGrowId: String)
    fun findByJobGrowNameIgnoreCase(jobGrowName: String): List<DnfSkillEntity>
    fun findByJobNameIgnoreCase(jobName: String): List<DnfSkillEntity>
    fun findBySkillId(skillId: String): List<DnfSkillEntity>
}
