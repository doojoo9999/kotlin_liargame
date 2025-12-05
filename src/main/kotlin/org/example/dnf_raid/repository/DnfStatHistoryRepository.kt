package org.example.dnf_raid.repository

import org.example.dnf_raid.model.DnfStatHistoryEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface DnfStatHistoryRepository : JpaRepository<DnfStatHistoryEntity, UUID> {
    fun findByParticipantIdOrderByCreatedAtAsc(participantId: UUID): List<DnfStatHistoryEntity>
}
