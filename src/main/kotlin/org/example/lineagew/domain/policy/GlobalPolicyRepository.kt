package org.example.lineagew.domain.policy

import org.springframework.data.jpa.repository.JpaRepository

interface GlobalPolicyRepository : JpaRepository<GlobalPolicy, Long>
