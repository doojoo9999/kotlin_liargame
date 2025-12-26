package org.example.dnf_raid.service

import org.example.dnf_raid.model.BuffStats
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class DnfPowerCalculatorTest {

    @Test
    fun `dundam buff score baseline`() {
        val stats = BuffStats(totalStat = 25_250.0, totalAttack = 3_000.0)
        val score = calcDundamBuffScore(stats)
        assertEquals(30_750.0, score, 0.001)
    }

    @Test
    fun `buff multiplier 1x at baseline`() {
        val stats = BuffStats(25_250.0, 3_000.0)
        val score = calcDundamBuffScore(stats)
        val mult = buffMultiplierFromBuffScore(score)
        assertEquals(1.0, mult, 0.001)
    }

    @Test
    fun `buff multiplier scales linearly`() {
        val statsLow = BuffStats(12_625.0, 1_500.0)
        val statsHigh = BuffStats(50_500.0, 6_000.0)

        val scoreLow = calcDundamBuffScore(statsLow)
        val scoreHigh = calcDundamBuffScore(statsHigh)

        val multLow = buffMultiplierFromBuffScore(scoreLow)
        val multHigh = buffMultiplierFromBuffScore(scoreHigh)

        assertTrue(multLow < 1.0)
        assertTrue(multHigh > 1.0)
    }
}
