package org.example.lineagew.application.service

import org.example.lineagew.application.dto.*
import org.example.lineagew.common.*
import org.example.lineagew.domain.item.ItemRepository
import org.example.lineagew.domain.member.MemberRepository
import org.example.lineagew.domain.policy.GlobalPolicyRepository
import org.example.lineagew.domain.sale.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import kotlin.math.abs

@Service
class SaleService(
    private val saleRepository: SaleRepository,
    private val itemRepository: ItemRepository,
    private val memberRepository: MemberRepository,
    private val distributionRuleRepository: DistributionRuleRepository,
    private val payoutRepository: PayoutRepository,
    private val participationBonusLogRepository: ParticipationBonusLogRepository,
    private val distributionEngine: DistributionEngine,
    private val clanFundService: ClanFundService,
    private val auditService: AuditService,
    private val idempotencyService: IdempotencyService,
    private val policyRepository: GlobalPolicyRepository
) {

    @Transactional
    fun createSale(request: SaleCreateRequest): SaleResponse {
        val item = itemRepository.findById(request.itemId)
            .orElseThrow { IllegalArgumentException("Item not found: ${request.itemId}") }
        item.status = ItemStatus.RESERVED
        val sale = Sale(
            item = item,
            soldAt = request.soldAt,
            buyer = request.buyer,
            grossAmount = request.grossAmount,
            feeAmount = request.feeAmount,
            taxAmount = request.taxAmount,
            memo = request.memo
        ).apply { recalculateNet() }
        val saved = saleRepository.save(sale)
        auditService.record(
            action = AuditAction.CREATE_SALE,
            objectType = AuditObjectType.SALE,
            objectId = saved.id!!,
            after = saved.toResponse(null, emptyList()),
            endpoint = "SALE_CREATE"
        )
        return saved.toResponse(null, emptyList())
    }

    @Transactional
    fun updateSale(id: Long, request: SaleCreateRequest): SaleResponse {
        val sale = saleRepository.findById(id).orElseThrow { IllegalArgumentException("Sale not found: $id") }
        sale.ensureDraft()
        val before = sale.copyForAudit()
        if (sale.item.id != request.itemId) {
            val newItem = itemRepository.findById(request.itemId)
                .orElseThrow { IllegalArgumentException("Item not found: ${request.itemId}") }
            sale.item.status = ItemStatus.IN_STOCK
            newItem.status = ItemStatus.RESERVED
            sale.item = newItem
        }
        sale.soldAt = request.soldAt
        sale.buyer = request.buyer
        sale.grossAmount = request.grossAmount
        sale.feeAmount = request.feeAmount
        sale.taxAmount = request.taxAmount
        sale.memo = request.memo
        sale.recalculateNet()
        auditService.record(
            action = AuditAction.UPDATE_SALE,
            objectType = AuditObjectType.SALE,
            objectId = sale.id!!,
            before = before,
            after = sale.toResponse(null, emptyList()),
            endpoint = "SALE_UPDATE"
        )
        return sale.toResponse(null, emptyList())
    }

    @Transactional(readOnly = true)
    fun getSale(id: Long): SaleResponse {
        val sale = saleRepository.findById(id).orElseThrow { IllegalArgumentException("Sale not found: $id") }
        val rule = distributionRuleRepository.findBySaleId(id)
        val payouts = payoutRepository.findAllBySaleId(id)
        return sale.toResponse(rule, payouts)
    }

    @Transactional(readOnly = true)
    fun listSales(state: SaleState? = null): List<SaleResponse> = when (state) {
        null -> saleRepository.findAll()
        else -> saleRepository.findAllByState(state)
    }.sortedByDescending { it.soldAt }
        .map { sale ->
            val rule = sale.id?.let { distributionRuleRepository.findBySaleId(it) }
            val payouts = sale.id?.let { payoutRepository.findAllBySaleId(it) } ?: emptyList()
            sale.toResponse(rule, payouts)
        }

    @Transactional
    fun finalizeSale(saleId: Long, request: FinalizeSaleRequest): SaleResponse {
        val sale = saleRepository.findById(saleId).orElseThrow { IllegalArgumentException("Sale not found: $saleId") }
        sale.ensureDraft()

        request.idempotencyKey?.let { key ->
            if (idempotencyService.exists(key)) {
                return getSale(saleId)
            }
        }

        val policy = policyRepository.findAll().firstOrNull()

        val rule = DistributionRule(
            sale = sale,
            mode = request.rule.mode,
            roundingMode = request.rule.roundingMode,
            remainderPolicy = request.rule.remainderPolicy,
            manualRemainderMember = request.rule.manualRemainderMemberId?.let { id ->
                memberRepository.findById(id).orElseThrow { IllegalArgumentException("Member not found: $id") }
            },
            participationBonusEnabled = request.rule.participationBonusEnabled,
            bonusWindow = request.rule.bonusWindow,
            bonusCurve = request.rule.bonusCurve,
            bonusBaseMultiplier = request.rule.bonusBaseMultiplier
                ?: policy?.bonusBaseMultiplier ?: BigDecimal.ONE,
            bonusCapMultiplier = request.rule.bonusCapMultiplier
                ?: policy?.bonusCapMultiplier ?: BigDecimal("1.30"),
            penaltyFloorMultiplier = request.rule.penaltyFloorMultiplier
                ?: policy?.penaltyFloorMultiplier ?: BigDecimal("0.70"),
            decayPolicy = request.rule.decayPolicy,
            decayHalfLifeDays = request.rule.decayHalfLifeDays ?: policy?.decayHalfLifeDays,
            bonusLinearSlope = request.rule.bonusLinearSlope ?: policy?.bonusLinearSlope,
            bonusLinearIntercept = request.rule.bonusLinearIntercept ?: policy?.bonusLinearIntercept,
            bonusLogisticK = request.rule.bonusLogisticK,
            bonusLogisticX0 = request.rule.bonusLogisticX0
        )

        rule.stepTiers.clear()
        request.rule.stepTiers.forEach { tier ->
            rule.stepTiers.add(tier.toEntity())
        }

        val participantInputs = request.participants.map { participantRequest ->
            val member = memberRepository.findById(participantRequest.memberId)
                .orElseThrow { IllegalArgumentException("Member not found: ${participantRequest.memberId}") }
            DistributionParticipantInput(
                member = member,
                baseWeight = participantRequest.baseWeight
            )
        }

        val computation = distributionEngine.computeDistribution(sale, rule, participantInputs)

        val adjustedParticipants = handleRemainder(rule, computation)

        val distributionParticipants = adjustedParticipants.map { participant ->
            DistributionParticipant(
                distributionRule = rule,
                member = participant.member,
                baseWeight = participant.baseWeight,
                bonusMultiplier = participant.bonusMultiplier,
                finalWeight = participant.finalWeight
            )
        }
        rule.participants.addAll(distributionParticipants)

        participationBonusLogRepository.deleteAllBySaleId(sale.id!!)
        participationBonusLogRepository.saveAll(adjustedParticipants.map { it.bonusLog })

        payoutRepository.deleteAllBySaleId(sale.id!!)
        val payouts = adjustedParticipants.map { participant ->
            Payout(
                sale = sale,
                member = participant.member,
                amount = participant.amount
            )
        }
        payoutRepository.saveAll(payouts)

        sale.markFinalized()
        sale.item.status = ItemStatus.SOLD

        distributionRuleRepository.save(rule)

        request.idempotencyKey?.let { key ->
            idempotencyService.register(key, endpoint = "SALE_FINALIZE")
        }

        auditService.record(
            action = AuditAction.SETTLE_SALE,
            objectType = AuditObjectType.SALE,
            objectId = sale.id!!,
            after = rule.toResponse(),
            endpoint = "SALE_FINALIZE"
        )

        return sale.toResponse(rule, payoutRepository.findAllBySaleId(sale.id!!))
    }

    @Transactional
    fun cancelSale(saleId: Long, actorMemberId: Long? = null): SaleResponse {
        val sale = saleRepository.findById(saleId).orElseThrow { IllegalArgumentException("Sale not found: $saleId") }
        val before = sale.copyForAudit()
        sale.markCanceled()
        sale.item.status = ItemStatus.IN_STOCK
        val rule = distributionRuleRepository.findBySaleId(saleId)
        rule?.let { distributionRuleRepository.delete(it) }
        payoutRepository.deleteAllBySaleId(saleId)
        participationBonusLogRepository.deleteAllBySaleId(saleId)
        auditService.record(
            action = AuditAction.CANCEL_SALE,
            objectType = AuditObjectType.SALE,
            objectId = sale.id!!,
            before = before,
            after = sale.toResponse(null, emptyList()),
            endpoint = "SALE_CANCEL",
            actorMemberId = actorMemberId
        )
        return sale.toResponse(null, emptyList())
    }

    private fun Sale.copyForAudit(): SaleSnapshot = SaleSnapshot(
        id = id,
        itemId = item.id,
        soldAt = soldAt,
        buyer = buyer,
        grossAmount = grossAmount,
        feeAmount = feeAmount,
        taxAmount = taxAmount,
        netAmount = netAmount,
        state = state,
        memo = memo
    )

    private fun handleRemainder(
        rule: DistributionRule,
        computation: DistributionComputation
    ): List<ParticipantComputation> {
        if (computation.remainder == 0L) {
            return computation.participants
        }

        val remainder = computation.remainder
        return when (rule.remainderPolicy) {
            RemainderPolicy.TO_CLAN_FUND -> {
                val type = if (remainder >= 0) ClanFundTxnType.INCOME else ClanFundTxnType.EXPENSE
                clanFundService.recordTransaction(
                    type = type,
                    amount = abs(remainder),
                    title = "Sale remainder #${rule.sale.id}",
                    sale = rule.sale
                )
                computation.participants
            }
            RemainderPolicy.HIGHEST_WEIGHT -> {
                val target = computation.participants.maxByOrNull { it.finalWeight }
                    ?: throw IllegalStateException("No participants for remainder")
                computation.participants.map {
                    if (it.member.id == target.member.id) it.copy(amount = it.amount + remainder) else it
                }
            }
            RemainderPolicy.OLDEST_MEMBER -> {
                val target = computation.participants.minWithOrNull(compareBy<ParticipantComputation> {
                    it.member.joinedAt ?: LocalDate.MAX
                }.thenBy { it.member.id!! }) ?: throw IllegalStateException("No participants")
                computation.participants.map {
                    if (it.member.id == target.member.id) it.copy(amount = it.amount + remainder) else it
                }
            }
            RemainderPolicy.MANUAL_MEMBER -> {
                val manualMemberId = rule.manualRemainderMember?.id
                    ?: throw IllegalArgumentException("Manual remainder member must be provided")
                computation.participants.map {
                    if (it.member.id == manualMemberId) it.copy(amount = it.amount + remainder) else it
                }
            }
        }
    }

    private data class SaleSnapshot(
        val id: Long?,
        val itemId: Long?,
        val soldAt: java.time.LocalDateTime,
        val buyer: String?,
        val grossAmount: Long,
        val feeAmount: Long,
        val taxAmount: Long,
        val netAmount: Long,
        val state: SaleState,
        val memo: String?
    )
}
