package org.example.dnf_raid.service

/**
 * Serialized payload stored in dnf_calculated_damages.calc_json.
 * Contains the dealer calculation result (with top skills) and buffer score.
 */
data class DamageCalculationPayload(
    val dealer: DnfPowerCalculator.DealerCalculationResult?,
    val bufferScore: Double?
)
