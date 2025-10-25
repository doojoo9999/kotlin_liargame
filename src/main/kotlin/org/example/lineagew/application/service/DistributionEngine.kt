package org.example.lineagew.application.service

import org.example.lineagew.common.*
import org.example.lineagew.domain.bosskill.BossKillRepository
import org.example.lineagew.domain.member.Member
import org.example.lineagew.domain.sale.BonusStepTier
import org.example.lineagew.domain.sale.DistributionRule
import org.example.lineagew.domain.sale.ParticipationBonusLog
import org.example.lineagew.domain.sale.Sale
import org.springframework.stereotype.Component
import java.math.BigDecimal
import java.math.MathContext
import java.math.RoundingMode
import java.time.Duration
import java.time.LocalDateTime
import kotlin.math.exp

data class DistributionParticipantInput(
    val member: Member,
    val baseWeight: BigDecimal
)

data class ParticipantComputation(
    val member: Member,
    val baseWeight: BigDecimal,
    val bonusMultiplier: BigDecimal,
    val finalWeight: BigDecimal,
    val amount: Long,
    val bonusLog: ParticipationBonusLog
)

data class DistributionComputation(
    val participants: List<ParticipantComputation>,
    val remainder: Long
)

@Component
class DistributionEngine(
    private val bossKillRepository: BossKillRepository
) {

    fun computeDistribution(
        sale: Sale,
        rule: DistributionRule,
        inputs: List<DistributionParticipantInput>
    ): DistributionComputation {
        require(inputs.isNotEmpty()) { "Participants are required" }

        val net = sale.netAmount
        require(net >= 0) { "Net amount must be non-negative" }

        val roundingMode = when (rule.roundingMode) {
            RoundingStrategy.FLOOR -> RoundingMode.FLOOR
            RoundingStrategy.CEIL -> RoundingMode.CEILING
            RoundingStrategy.ROUND -> RoundingMode.HALF_UP
        }

        val participantComputations = inputs.map { input ->
            val bonusResult = computeBonusMultiplier(input, rule, sale.soldAt)
            val finalWeight = when (rule.mode) {
                DistributionMode.EQUAL_SPLIT -> BigDecimal.ONE
                DistributionMode.WEIGHTED -> input.baseWeight.multiply(bonusResult.multiplier, MATH_CONTEXT)
            }

            ParticipantIntermediate(
                member = input.member,
                baseWeight = input.baseWeight,
                bonusMultiplier = bonusResult.multiplier,
                finalWeight = finalWeight,
                bonusLog = ParticipationBonusLog(
                    sale = sale,
                    member = input.member,
                    bonusWindow = rule.bonusWindow,
                    rawCount = bonusResult.rawCount,
                    score = bonusResult.score,
                    multiplier = bonusResult.multiplier,
                    curveParams = bonusResult.curveParams
                )
            )
        }

        val theoreticalAmounts = when (rule.mode) {
            DistributionMode.EQUAL_SPLIT -> equalSplit(participantComputations, net)
            DistributionMode.WEIGHTED -> weightedSplit(participantComputations, net)
        }

        val roundedParticipants = theoreticalAmounts.map { (intermediate, theoretical) ->
            val rounded = theoretical.setScale(0, roundingMode)
            ParticipantComputation(
                member = intermediate.member,
                baseWeight = intermediate.baseWeight,
                bonusMultiplier = intermediate.bonusMultiplier,
                finalWeight = intermediate.finalWeight,
                amount = rounded.longValueExact(),
                bonusLog = intermediate.bonusLog
            )
        }

        val remainder = net - roundedParticipants.sumOf { it.amount }
        return DistributionComputation(roundedParticipants, remainder)
    }

    private fun equalSplit(
        participants: List<ParticipantIntermediate>,
        net: Long
    ): List<Pair<ParticipantIntermediate, BigDecimal>> {
        val netDecimal = BigDecimal.valueOf(net)
        val share = netDecimal.divide(BigDecimal.valueOf(participants.size.toLong()), MATH_CONTEXT)
        return participants.map { it to share }
    }

    private fun weightedSplit(
        participants: List<ParticipantIntermediate>,
        net: Long
    ): List<Pair<ParticipantIntermediate, BigDecimal>> {
        val netDecimal = BigDecimal.valueOf(net)
        val totalWeight = participants.fold(BigDecimal.ZERO) { acc, p -> acc + p.finalWeight }
        require(totalWeight > BigDecimal.ZERO) { "Total weight must be positive" }
        return participants.map { participant ->
            val proportion = participant.finalWeight.divide(totalWeight, MATH_CONTEXT)
            participant to netDecimal.multiply(proportion, MATH_CONTEXT)
        }
    }

    private fun computeBonusMultiplier(
        input: DistributionParticipantInput,
        rule: DistributionRule,
        soldAt: LocalDateTime
    ): BonusComputationResult {
        if (!rule.participationBonusEnabled) {
            return BonusComputationResult(
                multiplier = rule.bonusBaseMultiplier,
                rawCount = 0.0,
                score = 0.0,
                curveParams = "bonus_disabled"
            )
        }

        val windowDuration: Duration = rule.bonusWindow.toDuration()
        val from = soldAt.minus(windowDuration)
        val participations = bossKillRepository.findParticipantsWithinWindow(
            memberId = requireNotNull(input.member.id),
            from = from,
            to = soldAt
        )

        val rawCount = participations.count().toDouble()

        val score = when (rule.decayPolicy) {
            DecayPolicy.NONE -> rawCount
            DecayPolicy.EXP_DECAY -> {
                val halfLife = rule.decayHalfLifeDays ?: 7
                participations.sumOf { participant ->
                    val days = Duration.between(participant.bossKill.killedAt, soldAt).toDays().toDouble()
                    if (days <= 0) 1.0 else exp(-LN2 * (days / halfLife))
                }
            }
        }

        val multiplier = when (rule.bonusCurve) {
            BonusCurveType.STEP -> applyStepCurve(rule.stepTiers, score)
            BonusCurveType.LINEAR -> applyLinearCurve(rule, score)
            BonusCurveType.LOGISTIC -> applyLogisticCurve(rule, score)
        }

        val withBase = multiplier.multiply(rule.bonusBaseMultiplier, MATH_CONTEXT)
        val clamped = withBase.coerceIn(rule.penaltyFloorMultiplier, rule.bonusCapMultiplier)

        val paramsDescription = when (rule.bonusCurve) {
            BonusCurveType.STEP -> "step=${rule.stepTiers.joinToString { "${it.minParticipation}:${it.multiplier}" }}"
            BonusCurveType.LINEAR -> "linear=a:${rule.bonusLinearSlope},b:${rule.bonusLinearIntercept}"
            BonusCurveType.LOGISTIC -> "logistic=k:${rule.bonusLogisticK},x0:${rule.bonusLogisticX0}"
        }

        return BonusComputationResult(
            multiplier = clamped,
            rawCount = rawCount,
            score = score,
            curveParams = paramsDescription
        )
    }

    private fun applyStepCurve(stepTiers: List<BonusStepTier>, score: Double): BigDecimal {
        if (stepTiers.isEmpty()) return BigDecimal.ONE
        val sorted = stepTiers.sortedBy { it.minParticipation }
        val applicable = sorted.lastOrNull { score >= it.minParticipation }
        return applicable?.multiplier ?: sorted.first().multiplier
    }

    private fun applyLinearCurve(rule: DistributionRule, score: Double): BigDecimal {
        val slope = rule.bonusLinearSlope ?: BigDecimal("0.0")
        val intercept = rule.bonusLinearIntercept ?: BigDecimal.ONE
        val scoreDecimal = BigDecimal.valueOf(score)
        return slope.multiply(scoreDecimal, MATH_CONTEXT).add(intercept, MATH_CONTEXT)
    }

    private fun applyLogisticCurve(rule: DistributionRule, score: Double): BigDecimal {
        val k = rule.bonusLogisticK ?: BigDecimal("0.8")
        val x0 = rule.bonusLogisticX0 ?: BigDecimal("3.0")
        val penalty = rule.penaltyFloorMultiplier
        val cap = rule.bonusCapMultiplier
        val expComponent = exp(-k.toDouble() * (score - x0.toDouble()))
        val penaltyDouble = penalty.toDouble()
        val capDouble = cap.toDouble()
        val value = penaltyDouble + (capDouble - penaltyDouble) / (1.0 + expComponent)
        return BigDecimal.valueOf(value)
    }

    private fun BigDecimal.coerceIn(min: BigDecimal, max: BigDecimal): BigDecimal = when {
        this < min -> min
        this > max -> max
        else -> this
    }

    private data class ParticipantIntermediate(
        val member: Member,
        val baseWeight: BigDecimal,
        val bonusMultiplier: BigDecimal,
        val finalWeight: BigDecimal,
        val bonusLog: ParticipationBonusLog
    )

    private data class BonusComputationResult(
        val multiplier: BigDecimal,
        val rawCount: Double,
        val score: Double,
        val curveParams: String
    )

    companion object {
        private val MATH_CONTEXT = MathContext(12, RoundingMode.HALF_UP)
        private const val LN2 = 0.6931471805599453
    }
}
