package org.example.lineagew.application.dto

import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import org.example.lineagew.common.*
import org.example.lineagew.domain.sale.BonusStepTier
import org.example.lineagew.domain.sale.DistributionParticipant
import org.example.lineagew.domain.sale.DistributionRule
import org.example.lineagew.domain.sale.Payout
import org.example.lineagew.domain.sale.Sale
import java.math.BigDecimal
import java.time.LocalDateTime

data class SaleCreateRequest(
    @field:NotNull
    val itemId: Long,

    @field:NotNull
    val soldAt: LocalDateTime,

    val buyer: String? = null,

    @field:Min(0)
    val grossAmount: Long,

    @field:Min(0)
    val feeAmount: Long = 0,

    @field:Min(0)
    val taxAmount: Long = 0,

    val memo: String? = null
)

data class SaleResponse(
    val id: Long,
    val itemId: Long,
    val soldAt: LocalDateTime,
    val buyer: String?,
    val grossAmount: Long,
    val feeAmount: Long,
    val taxAmount: Long,
    val netAmount: Long,
    val state: SaleState,
    val memo: String?,
    val distributionRule: DistributionRuleResponse?,
    val payouts: List<PayoutResponse>
)

fun Sale.toResponse(rule: DistributionRule?, payouts: List<Payout>): SaleResponse = SaleResponse(
    id = requireNotNull(id),
    itemId = item.id!!,
    soldAt = soldAt,
    buyer = buyer,
    grossAmount = grossAmount,
    feeAmount = feeAmount,
    taxAmount = taxAmount,
    netAmount = netAmount,
    state = state,
    memo = memo,
    distributionRule = rule?.toResponse(),
    payouts = payouts.map { it.toResponse() }
)

data class DistributionRuleRequest(
    val mode: DistributionMode = DistributionMode.EQUAL_SPLIT,
    val roundingMode: RoundingStrategy = RoundingStrategy.ROUND,
    val remainderPolicy: RemainderPolicy = RemainderPolicy.TO_CLAN_FUND,
    val manualRemainderMemberId: Long? = null,
    val participationBonusEnabled: Boolean = true,
    val bonusWindow: BonusWindow = BonusWindow.WEEK,
    val bonusCurve: BonusCurveType = BonusCurveType.LINEAR,
    val bonusBaseMultiplier: BigDecimal? = null,
    val bonusCapMultiplier: BigDecimal? = null,
    val penaltyFloorMultiplier: BigDecimal? = null,
    val decayPolicy: DecayPolicy = DecayPolicy.NONE,
    val decayHalfLifeDays: Int? = null,
    val bonusLinearSlope: BigDecimal? = null,
    val bonusLinearIntercept: BigDecimal? = null,
    val bonusLogisticK: BigDecimal? = null,
    val bonusLogisticX0: BigDecimal? = null,
    val stepTiers: List<BonusStepTierRequest> = emptyList()
)

data class BonusStepTierRequest(
    val minParticipation: Int,
    val multiplier: BigDecimal
)

data class DistributionParticipantRequest(
    @field:NotNull
    val memberId: Long,

    val baseWeight: BigDecimal = BigDecimal.ONE
)

data class FinalizeSaleRequest(
    val idempotencyKey: String? = null,
    @field:Valid
    val rule: DistributionRuleRequest,

    @field:NotEmpty
    val participants: List<@Valid DistributionParticipantRequest>
)

data class DistributionRuleResponse(
    val id: Long,
    val mode: DistributionMode,
    val roundingMode: RoundingStrategy,
    val remainderPolicy: RemainderPolicy,
    val manualRemainderMemberId: Long?,
    val participationBonusEnabled: Boolean,
    val bonusWindow: BonusWindow,
    val bonusCurve: BonusCurveType,
    val bonusBaseMultiplier: BigDecimal,
    val bonusCapMultiplier: BigDecimal,
    val penaltyFloorMultiplier: BigDecimal,
    val decayPolicy: DecayPolicy,
    val decayHalfLifeDays: Int?,
    val bonusLinearSlope: BigDecimal?,
    val bonusLinearIntercept: BigDecimal?,
    val bonusLogisticK: BigDecimal?,
    val bonusLogisticX0: BigDecimal?,
    val stepTiers: List<BonusStepTierRequest>,
    val participants: List<DistributionParticipantResponse>
)

data class DistributionParticipantResponse(
    val id: Long,
    val memberId: Long,
    val memberName: String,
    val baseWeight: BigDecimal,
    val bonusMultiplier: BigDecimal,
    val finalWeight: BigDecimal
)

data class PayoutResponse(
    val id: Long,
    val memberId: Long,
    val amount: Long
)

fun DistributionRule.toResponse(): DistributionRuleResponse = DistributionRuleResponse(
    id = requireNotNull(id),
    mode = mode,
    roundingMode = roundingMode,
    remainderPolicy = remainderPolicy,
    manualRemainderMemberId = manualRemainderMember?.id,
    participationBonusEnabled = participationBonusEnabled,
    bonusWindow = bonusWindow,
    bonusCurve = bonusCurve,
    bonusBaseMultiplier = bonusBaseMultiplier,
    bonusCapMultiplier = bonusCapMultiplier,
    penaltyFloorMultiplier = penaltyFloorMultiplier,
    decayPolicy = decayPolicy,
    decayHalfLifeDays = decayHalfLifeDays,
    bonusLinearSlope = bonusLinearSlope,
    bonusLinearIntercept = bonusLinearIntercept,
    bonusLogisticK = bonusLogisticK,
    bonusLogisticX0 = bonusLogisticX0,
    stepTiers = stepTiers.map { BonusStepTierRequest(it.minParticipation, it.multiplier) },
    participants = participants.map { it.toResponse() }
)

fun DistributionParticipant.toResponse(): DistributionParticipantResponse = DistributionParticipantResponse(
    id = requireNotNull(id),
    memberId = member.id!!,
    memberName = member.name,
    baseWeight = baseWeight,
    bonusMultiplier = bonusMultiplier,
    finalWeight = finalWeight
)

fun Payout.toResponse(): PayoutResponse = PayoutResponse(
    id = requireNotNull(id),
    memberId = member.id!!,
    amount = amount
)

fun BonusStepTierRequest.toEntity(): BonusStepTier = BonusStepTier(
    minParticipation = minParticipation,
    multiplier = multiplier
)
