package org.example.lineagew.domain.boss

import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface BossRepository : JpaRepository<Boss, Long> {
    fun findByNameIgnoreCase(name: String): Optional<Boss>
}
