package org.example.lineagew.application.dto

import org.example.lineagew.common.*
import org.example.lineagew.domain.policy.GlobalPolicy
import java.math.BigDecimal

data class GlobalPolicyRequest(
    val defaultRounding: RoundingStrategy = RoundingStrategy.ROUND,
    val defaultRemainder: RemainderPolicy = RemainderPolicy.TO_CLAN_FUND,
    val defaultBonusWindow: BonusWindow = BonusWindow.WEEK,
    val defaultBonusCurve: BonusCurveType = BonusCurveType.LINEAR,
    val bonusBaseMultiplier: BigDecimal = BigDecimal.ONE,
    val bonusCapMultiplier: BigDecimal = BigDecimal("1.30"),
    val penaltyFloorMultiplier: BigDecimal = BigDecimal("0.70"),
    val decayPolicy: DecayPolicy = DecayPolicy.NONE,
    val decayHalfLifeDays: Int? = null,
    val bonusLinearSlope: BigDecimal = BigDecimal("0.05"),
    val bonusLinearIntercept: BigDecimal = BigDecimal("0.90")
)

data class GlobalPolicyResponse(
    val id: Long,
    val defaultRounding: RoundingStrategy,
    val defaultRemainder: RemainderPolicy,
    val defaultBonusWindow: BonusWindow,
    val defaultBonusCurve: BonusCurveType,
    val bonusBaseMultiplier: BigDecimal,
    val bonusCapMultiplier: BigDecimal,
    val penaltyFloorMultiplier: BigDecimal,
    val decayPolicy: DecayPolicy,
    val decayHalfLifeDays: Int?,
    val bonusLinearSlope: BigDecimal,
    val bonusLinearIntercept: BigDecimal
)

fun GlobalPolicy.toResponse(): GlobalPolicyResponse = GlobalPolicyResponse(
    id = requireNotNull(id),
    defaultRounding = defaultRounding,
    defaultRemainder = defaultRemainder,
    defaultBonusWindow = defaultBonusWindow,
    defaultBonusCurve = defaultBonusCurve,
    bonusBaseMultiplier = bonusBaseMultiplier,
    bonusCapMultiplier = bonusCapMultiplier,
    penaltyFloorMultiplier = penaltyFloorMultiplier,
    decayPolicy = decayPolicy,
    decayHalfLifeDays = decayHalfLifeDays,
    bonusLinearSlope = bonusLinearSlope,
    bonusLinearIntercept = bonusLinearIntercept
)
