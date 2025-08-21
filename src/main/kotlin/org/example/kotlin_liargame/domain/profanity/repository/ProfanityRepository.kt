package org.example.kotlin_liargame.domain.profanity.repository

import org.example.kotlin_liargame.domain.profanity.model.ProfanityEntity
import org.springframework.data.jpa.repository.JpaRepository

interface ProfanityRepository : JpaRepository<ProfanityEntity, Long> {
    fun existsByWord(word: String): Boolean
}
