package org.example.dnf_raid.repository

import org.example.dnf_raid.model.DnfCharacterEntity
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface DnfCharacterRepository : JpaRepository<DnfCharacterEntity, String> {
    fun findByAdventureNameContainingIgnoreCase(adventureName: String, pageable: Pageable): List<DnfCharacterEntity>
    fun findByLastUpdatedAtAfter(lastUpdatedAt: java.time.LocalDateTime): List<DnfCharacterEntity>
}
