package org.example.lineagew.domain.sale

import jakarta.persistence.*
import org.example.lineagew.common.*
import org.example.lineagew.domain.item.Item
import org.example.lineagew.domain.member.Member
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(name = "linw_sales")
class Sale(
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false, unique = true)
    var item: Item,

    @Column(name = "sold_at", nullable = false)
    var soldAt: LocalDateTime,

    @Column(length = 120)
    var buyer: String? = null,

    @Column(name = "gross_amount", nullable = false)
    var grossAmount: Long,

    @Column(name = "fee_amount", nullable = false)
    var feeAmount: Long = 0,

    @Column(name = "tax_amount", nullable = false)
    var taxAmount: Long = 0,

    @Column(name = "net_amount", nullable = false)
    var netAmount: Long = grossAmount - feeAmount - taxAmount,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var state: SaleState = SaleState.DRAFT,

    @Column(columnDefinition = "text")
    var memo: String? = null
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    fun recalculateNet() {
        netAmount = grossAmount - feeAmount - taxAmount
    }

    fun ensureDraft() {
        require(state == SaleState.DRAFT) { "Sale must be in DRAFT state" }
    }

    fun markFinalized() {
        state = SaleState.FINALIZED
    }

    fun markCanceled() {
        state = SaleState.CANCELED
    }
}

@Embeddable
data class BonusStepTier(
    @Column(name = "min_participation")
    var minParticipation: Int = 0,

    @Column(name = "multiplier", precision = 12, scale = 4)
    var multiplier: BigDecimal = BigDecimal.ONE
)

@Entity
@Table(name = "linw_distribution_rules")
class DistributionRule(
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false, unique = true)
    var sale: Sale,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var mode: DistributionMode = DistributionMode.EQUAL_SPLIT,

    @Enumerated(EnumType.STRING)
    @Column(name = "rounding_mode", nullable = false, length = 8)
    var roundingMode: RoundingStrategy = RoundingStrategy.ROUND,

    @Enumerated(EnumType.STRING)
    @Column(name = "remainder_policy", nullable = false, length = 32)
    var remainderPolicy: RemainderPolicy = RemainderPolicy.TO_CLAN_FUND,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manual_remainder_member_id")
    var manualRemainderMember: Member? = null,

    @Column(name = "participation_bonus_enabled", nullable = false)
    var participationBonusEnabled: Boolean = true,

    @Enumerated(EnumType.STRING)
    @Column(name = "bonus_window", nullable = false, length = 16)
    var bonusWindow: BonusWindow = BonusWindow.WEEK,

    @Enumerated(EnumType.STRING)
    @Column(name = "bonus_curve", nullable = false, length = 16)
    var bonusCurve: BonusCurveType = BonusCurveType.LINEAR,

    @Column(name = "bonus_base_multiplier", precision = 12, scale = 4, nullable = false)
    var bonusBaseMultiplier: BigDecimal = BigDecimal.ONE,

    @Column(name = "bonus_cap_multiplier", precision = 12, scale = 4, nullable = false)
    var bonusCapMultiplier: BigDecimal = BigDecimal("1.30"),

    @Column(name = "penalty_floor_multiplier", precision = 12, scale = 4, nullable = false)
    var penaltyFloorMultiplier: BigDecimal = BigDecimal("0.70"),

    @Enumerated(EnumType.STRING)
    @Column(name = "decay_policy", nullable = false, length = 16)
    var decayPolicy: DecayPolicy = DecayPolicy.NONE,

    @Column(name = "decay_half_life_days")
    var decayHalfLifeDays: Int? = null,

    @Column(name = "bonus_linear_slope", precision = 12, scale = 6)
    var bonusLinearSlope: BigDecimal? = null,

    @Column(name = "bonus_linear_intercept", precision = 12, scale = 6)
    var bonusLinearIntercept: BigDecimal? = null,

    @Column(name = "bonus_logistic_k", precision = 12, scale = 6)
    var bonusLogisticK: BigDecimal? = null,

    @Column(name = "bonus_logistic_x0", precision = 12, scale = 6)
    var bonusLogisticX0: BigDecimal? = null
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
        name = "linw_distribution_rule_step_tiers",
        joinColumns = [JoinColumn(name = "distribution_rule_id")]
    )
    @OrderBy("minParticipation ASC")
    val stepTiers: MutableList<BonusStepTier> = mutableListOf()

    @OneToMany(mappedBy = "distributionRule", cascade = [CascadeType.ALL], orphanRemoval = true)
    val participants: MutableList<DistributionParticipant> = mutableListOf()
}

@Entity
@Table(
    name = "linw_distribution_participants",
    uniqueConstraints = [UniqueConstraint(columnNames = ["distribution_rule_id", "member_id"])]
)
class DistributionParticipant(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "distribution_rule_id", nullable = false)
    var distributionRule: DistributionRule,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    var member: Member,

    @Column(name = "base_weight", nullable = false, precision = 12, scale = 4)
    var baseWeight: BigDecimal,

    @Column(name = "bonus_multiplier", nullable = false, precision = 12, scale = 4)
    var bonusMultiplier: BigDecimal,

    @Column(name = "final_weight", nullable = false, precision = 12, scale = 4)
    var finalWeight: BigDecimal
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}

@Entity
@Table(
    name = "linw_payouts",
    uniqueConstraints = [UniqueConstraint(columnNames = ["sale_id", "member_id"])]
)
class Payout(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    var sale: Sale,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    var member: Member,

    @Column(nullable = false)
    var amount: Long,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var status: PayoutStatus = PayoutStatus.PENDING,

    @Column(name = "paid_at")
    var paidAt: LocalDateTime? = null,

    @Column(name = "paid_note", columnDefinition = "text")
    var paidNote: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paid_by_member_id")
    var paidByMember: Member? = null
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}

@Entity
@Table(name = "linw_participation_bonus_logs")
class ParticipationBonusLog(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    var sale: Sale,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    var member: Member,

    @Enumerated(EnumType.STRING)
    @Column(name = "bonus_window", nullable = false, length = 16)
    var bonusWindow: BonusWindow,

    @Column(name = "raw_count", nullable = false)
    var rawCount: Double,

    @Column(name = "score", nullable = false)
    var score: Double,

    @Column(name = "multiplier", nullable = false, precision = 12, scale = 4)
    var multiplier: BigDecimal,

    @Column(columnDefinition = "text")
    var curveParams: String? = null
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
