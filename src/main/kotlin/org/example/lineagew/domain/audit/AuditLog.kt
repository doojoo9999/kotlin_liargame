package org.example.lineagew.domain.audit

import jakarta.persistence.*
import org.example.lineagew.common.AuditAction
import org.example.lineagew.common.AuditObjectType
import org.example.lineagew.common.LineagewBaseEntity
import org.example.lineagew.domain.member.Member
import java.time.LocalDateTime

@Entity
@Table(name = "linw_audit_logs")
class AuditLog(
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var action: AuditAction,

    @Enumerated(EnumType.STRING)
    @Column(name = "object_type", nullable = false, length = 32)
    var objectType: AuditObjectType,

    @Column(name = "object_id", nullable = false)
    var objectId: Long,

    @Column(name = "occurred_at", nullable = false)
    var occurredAt: LocalDateTime = LocalDateTime.now(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_member_id")
    var actor: Member? = null,

    @Column(columnDefinition = "text")
    var beforeJson: String? = null,

    @Column(columnDefinition = "text")
    var afterJson: String? = null,

    @Column(length = 120)
    var endpoint: String? = null
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}

@Entity
@Table(name = "linw_idempotency_keys")
class IdempotencyKey(
    @Column(name = "idempotency_key", nullable = false, unique = true, length = 120)
    var idempotencyKey: String,

    @Column(nullable = false, length = 120)
    var endpoint: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
) {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
