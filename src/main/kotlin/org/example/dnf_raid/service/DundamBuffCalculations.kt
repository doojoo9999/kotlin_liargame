package org.example.dnf_raid.service

import org.example.dnf_raid.model.BuffStats

const val DEFAULT_DUNDAM_BUFF_SCORE = 30_750.0

fun calcDundamBuffScore(buffStats: BuffStats): Double {
    val s = 25_250.0
    val a = 3_000.0
    val c = 30_750.0

    val statPart = (buffStats.totalStat + s) / s
    val attackPart = (buffStats.totalAttack + a) / a

    return statPart * attackPart * c
}

fun buffMultiplierFromBuffScore(buffScore: Double): Double {
    if (DEFAULT_DUNDAM_BUFF_SCORE <= 0.0) return 1.0
    return buffScore / DEFAULT_DUNDAM_BUFF_SCORE
}
