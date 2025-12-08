package org.example.dnf_raid.repository

import org.example.dnf_raid.model.DnfRaidEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.domain.Pageable
import java.util.UUID

interface DnfRaidRepository : JpaRepository<DnfRaidEntity, UUID> {
    fun findFirstByUserIdOrderByCreatedAtDesc(userId: String): DnfRaidEntity?

    fun findByMotherRaidIdOrderByCreatedAtAsc(motherRaidId: UUID): List<DnfRaidEntity>

    fun findByNameContainingIgnoreCaseAndIsPublicTrueOrderByCreatedAtDesc(
        name: String,
        pageable: Pageable
    ): List<DnfRaidEntity>

    fun findByUserIdOrderByCreatedAtDesc(
        userId: String,
        pageable: Pageable
    ): List<DnfRaidEntity>
}
