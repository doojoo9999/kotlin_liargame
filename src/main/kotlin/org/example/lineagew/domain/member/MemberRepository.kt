package org.example.lineagew.domain.member

import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface MemberRepository : JpaRepository<Member, Long> {
    fun findByNameIgnoreCase(name: String): Optional<Member>
}
