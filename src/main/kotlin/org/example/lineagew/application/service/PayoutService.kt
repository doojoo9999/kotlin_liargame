package org.example.lineagew.application.service

import org.example.lineagew.application.dto.PayoutDetailResponse
import org.example.lineagew.application.dto.PayoutStatusUpdateRequest
import org.example.lineagew.application.dto.toDetailResponse
import org.example.lineagew.common.AuditAction
import org.example.lineagew.common.AuditObjectType
import org.example.lineagew.common.PayoutStatus
import org.example.lineagew.domain.member.MemberRepository
import org.example.lineagew.domain.sale.PayoutRepository
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

data class PayoutSearchCriteria(
    val status: PayoutStatus? = null,
    val memberId: Long? = null,
    val from: LocalDateTime? = null,
    val to: LocalDateTime? = null,
    val limit: Int? = null
)

@Service
class PayoutService(
    private val payoutRepository: PayoutRepository,
    private val memberRepository: MemberRepository,
    private val auditService: AuditService
) {

    @Transactional(readOnly = true)
    fun search(criteria: PayoutSearchCriteria): List<PayoutDetailResponse> {
        val pageable = criteria.limit
            ?.takeIf { it > 0 }
            ?.let { PageRequest.of(0, it.coerceAtMost(500)) }
            ?: Pageable.unpaged()

        val payouts = payoutRepository.search(
            status = criteria.status,
            memberId = criteria.memberId,
            from = criteria.from,
            to = criteria.to,
            pageable = pageable
        )
        return payouts.map { it.toDetailResponse() }
    }

    @Transactional
    fun updateStatus(payoutId: Long, request: PayoutStatusUpdateRequest): PayoutDetailResponse {
        val payout = payoutRepository.findById(payoutId)
            .orElseThrow { IllegalArgumentException("Payout $payoutId not found") }

        payout.status = request.status
        if (request.status == PayoutStatus.PAID) {
            payout.paidAt = request.paidAt ?: LocalDateTime.now()
            payout.paidNote = request.note
            payout.paidByMember = request.paidByMemberId?.let { memberId ->
                memberRepository.findById(memberId)
                    .orElseThrow { IllegalArgumentException("Member $memberId not found") }
            }
        } else {
            payout.paidAt = null
            payout.paidNote = null
            payout.paidByMember = null
        }

        auditService.record(
            action = AuditAction.UPDATE_PAYOUT_STATUS,
            objectType = AuditObjectType.SALE,
            objectId = payout.sale.id!!,
            after = mapOf(
                "payoutId" to payout.id,
                "memberId" to payout.member.id,
                "status" to payout.status.name,
                "paidAt" to payout.paidAt,
                "paidByMemberId" to payout.paidByMember?.id
            )
        )

        return payout.toDetailResponse()
    }
}
