package org.example.lineagew.common

import jakarta.persistence.Column
import jakarta.persistence.EntityListeners
import jakarta.persistence.MappedSuperclass
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

/**
 * Lightweight auditing base entity for the LineageW domain.
 * Keeps created/modified timestamps while staying independent from liar game modules.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class LineagewBaseEntity {

    @CreatedDate
    @Column(nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @LastModifiedDate
    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
        protected set
}
