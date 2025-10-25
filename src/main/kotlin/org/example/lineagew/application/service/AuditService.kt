package org.example.lineagew.application.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.example.lineagew.common.AuditAction
import org.example.lineagew.common.AuditObjectType
import org.example.lineagew.domain.audit.AuditLog
import org.example.lineagew.domain.audit.AuditLogRepository
import org.example.lineagew.domain.member.MemberRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AuditService(
    private val auditLogRepository: AuditLogRepository,
    private val memberRepository: MemberRepository,
    private val objectMapper: ObjectMapper
) {

    @Transactional
    fun record(
        action: AuditAction,
        objectType: AuditObjectType,
        objectId: Long,
        actorMemberId: Long? = null,
        before: Any? = null,
        after: Any? = null,
        endpoint: String? = null
    ) {
        val actor = actorMemberId?.let { memberRepository.findById(it).orElse(null) }
        val log = AuditLog(
            action = action,
            objectType = objectType,
            objectId = objectId,
            actor = actor,
            beforeJson = before?.let { serialize(it) },
            afterJson = after?.let { serialize(it) },
            endpoint = endpoint
        )
        auditLogRepository.save(log)
    }

    private fun serialize(target: Any): String =
        objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(target)
}
