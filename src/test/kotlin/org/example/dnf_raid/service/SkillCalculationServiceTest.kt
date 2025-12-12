package org.example.dnf_raid.service

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class SkillCalculationServiceTest {

    private val service = SkillCalculationService()

    @Test
    fun `calculates total damage percent with keyword filtering and multiplication`() {
        val template = """
            도끼 공격력 : {value1}
            활 설치 공격력 : {value2}
            상식과 규격을 벗어난 일격 공격력 : {value3}
            거대 검 확인 사살 공격력 : {value4} x {value5}
            적 홀드 시간 : {value6}
        """.trimIndent()

        val values = mapOf(
            "value1" to 90535,
            "value2" to 120714,
            "value3" to 271606,
            "value4" to 12071,
            "value5" to 10,
            "value6" to 3 // non-damage line should be ignored
        )

        val totalPercent = service.calculateTotalDamagePercent(template, values)
        assertEquals(603_565.0, totalPercent)

        val coeff = service.toSkillCoefficient(totalPercent)
        assertEquals(6_035.65, coeff, 0.01)
    }
}
