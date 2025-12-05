package org.example.dnf_raid.repository

import org.example.dnf_raid.model.DnfRaidEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface DnfRaidRepository : JpaRepository<DnfRaidEntity, UUID> {
    fun findFirstByUserIdOrderByCreatedAtDesc(userId: String): DnfRaidEntity?
}
