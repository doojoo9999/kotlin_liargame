package org.example.dnf_raid.model

/**
 * 2025 Middle Heaven (Jung-cheon) Update
 * Set Point System Calculation Table
 *
 * Tiers:
 * Rare: 65 points
 * Unique: 100-115 points
 * Legendary: 165 points
 * Epic: 215 points
 * Taecho: 265 points
 *
 * Source reference: Taecho full set ~141.59% Final Damage Increase.
 */
object SetEffectTable {

    fun getDamageMultiplier(totalPoints: Int): Double {
        return when {
            totalPoints >= 265 -> 1.416 // Taecho: ~41.6% increase
            totalPoints >= 215 -> 1.300 // Epic: Estimated ~30%
            totalPoints >= 165 -> 1.200 // Legendary: Estimated ~20%
            totalPoints >= 115 -> 1.100 // Unique Max: Estimated ~10%
            totalPoints >= 65  -> 1.050 // Rare: Estimated ~5%
            else -> 1.0
        }
    }

    /*
     * Buffer Multipliers are typically higher or scale differently.
     * Using a similar progression estimate for now.
     */
    fun getBuffMultiplier(totalPoints: Int): Double {
        return when {
            totalPoints >= 265 -> 1.250
            totalPoints >= 215 -> 1.200
            totalPoints >= 165 -> 1.150
            totalPoints >= 115 -> 1.100
            totalPoints >= 65  -> 1.050
            else -> 1.0
        }
    }
}
