package org.example.lineagew.domain.policy

import jakarta.persistence.*
import org.example.lineagew.common.*
import org.example.lineagew.common.LineagewBaseEntity
import java.math.BigDecimal

@Entity
@Table(name = "linw_global_policies")
class GlobalPolicy(
    @Enumerated(EnumType.STRING)
    @Column(name = "default_rounding", nullable = false, length = 8)
    var defaultRounding: RoundingStrategy = RoundingStrategy.ROUND,

    @Enumerated(EnumType.STRING)
    @Column(name = "default_remainder", nullable = false, length = 32)
    var defaultRemainder: RemainderPolicy = RemainderPolicy.TO_CLAN_FUND,

    @Enumerated(EnumType.STRING)
    @Column(name = "default_bonus_window", nullable = false, length = 16)
    var defaultBonusWindow: BonusWindow = BonusWindow.WEEK,

    @Enumerated(EnumType.STRING)
    @Column(name = "default_bonus_curve", nullable = false, length = 16)
    var defaultBonusCurve: BonusCurveType = BonusCurveType.LINEAR,

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
    var bonusLinearSlope: BigDecimal = BigDecimal("0.05"),

    @Column(name = "bonus_linear_intercept", precision = 12, scale = 6)
    var bonusLinearIntercept: BigDecimal = BigDecimal("0.90")
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
