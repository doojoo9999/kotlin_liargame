package org.example.lineagew.domain.essence

import org.springframework.data.jpa.repository.JpaRepository

interface EssenceRepository : JpaRepository<Essence, Long> {
    fun findByNameIgnoreCase(name: String): Essence?
}

interface EssenceTxnRepository : JpaRepository<EssenceTxn, Long> {
    fun findAllByEssenceIdOrderByOccurredAtDesc(essenceId: Long): List<EssenceTxn>
}
