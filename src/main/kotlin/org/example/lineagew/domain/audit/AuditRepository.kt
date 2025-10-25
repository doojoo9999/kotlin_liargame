package org.example.lineagew.domain.audit

import org.springframework.data.jpa.repository.JpaRepository

interface AuditLogRepository : JpaRepository<AuditLog, Long>

interface IdempotencyKeyRepository : JpaRepository<IdempotencyKey, Long> {
    fun findByIdempotencyKey(idempotencyKey: String): IdempotencyKey?
}
