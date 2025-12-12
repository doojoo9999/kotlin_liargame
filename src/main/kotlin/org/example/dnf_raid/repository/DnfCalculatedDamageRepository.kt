package org.example.dnf_raid.repository

import org.example.dnf_raid.model.DnfCalculatedDamageEntity
import org.springframework.data.jpa.repository.JpaRepository

interface DnfCalculatedDamageRepository : JpaRepository<DnfCalculatedDamageEntity, Long> {
    fun findByCharacterId(characterId: String): DnfCalculatedDamageEntity?
}
