package org.example.kotlin_liargame.domain.profanity.repository

import org.example.kotlin_liargame.domain.profanity.model.ProfanityRequestEntity
import org.example.kotlin_liargame.domain.profanity.model.ProfanityRequestStatus
import org.springframework.data.jpa.repository.JpaRepository

interface ProfanityRequestRepository : JpaRepository<ProfanityRequestEntity, Long> {
    fun findByStatus(status: ProfanityRequestStatus): List<ProfanityRequestEntity>
}
