package org.example.dnf_raid.repository

import org.example.dnf_raid.model.DnfStatHistoryEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface DnfStatHistoryRepository : JpaRepository<DnfStatHistoryEntity, UUID> {
    fun findByParticipantIdOrderByCreatedAtAsc(participantId: UUID): List<DnfStatHistoryEntity>

    @Modifying
    @Query("delete from DnfStatHistoryEntity s where s.participant.id = :participantId")
    fun deleteByParticipantId(participantId: UUID): Int
}
