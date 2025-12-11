package org.example.dnf_raid.repository

import org.example.dnf_raid.model.DnfJobGrowEntity
import org.example.dnf_raid.model.DnfJobGrowId
import org.springframework.data.jpa.repository.JpaRepository

interface DnfJobGrowRepository : JpaRepository<DnfJobGrowEntity, DnfJobGrowId> {
    fun findByJobId(jobId: String): List<DnfJobGrowEntity>
}
