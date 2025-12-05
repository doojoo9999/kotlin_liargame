package org.example.dnf_raid.repository

import org.example.dnf_raid.model.DnfParticipantEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface DnfParticipantRepository : JpaRepository<DnfParticipantEntity, UUID> {
    fun findByRaidIdOrderByCreatedAtAsc(raidId: UUID): List<DnfParticipantEntity>
}
