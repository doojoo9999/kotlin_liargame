package org.example.dnf_raid.service

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.example.dnf_raid.service.SkillDetailResponse

class SkillNormalizationTest {

    private val mapper = jacksonObjectMapper()

    @Test
    fun `normalizes skill detail and round trips level rows`() {
        val json = """
        {
          "name": "비선형적 엔트로피 스킵",
          "type": "active",
          "desc": "가장 치명적인 공격은 적이 예상할 수 없는 공격.",
          "descDetail": "가장 치명적인 공격은 적이 예상할 수 없는 공격.",
          "descSpecial": [ "무적, 적 홀드" ],
          "maxLevel": 50,
          "requiredLevel": 100,
          "levelInfo": {
            "optionDesc": "도끼 공격력 : {value1}\n활 설치 공격력 : {value2}",
            "rows": [
              {
                "level": 1,
                "consumeMp": 3944,
                "coolTime": 290,
                "castingTime": null,
                "optionValue": { "value1": 90535, "value2": 120714, "value3": 271606, "value4": 12071, "value5": 10 }
              },
              {
                "level": 2,
                "consumeMp": 4224,
                "coolTime": 290,
                "castingTime": null,
                "optionValue": { "value1": 111529, "value2": 148705, "value3": 334587, "value4": 14871, "value5": 10 }
              }
            ]
          }
        }
        """.trimIndent()

        val detail = mapper.readValue<SkillDetailResponse>(json)
        val normalized = detail.toNormalized()

        val rows = normalized.levelInfo?.rows ?: emptyList()
        assertEquals(2, rows.size)
        val first = rows.first()
        assertEquals(1, first.level)
        assertEquals(290.0, first.coolTime)
        assertEquals(90535.0, first.optionValue["value1"])
        assertEquals(10.0, first.optionValue["value5"])

        val rowsJson = mapper.writeValueAsString(rows)
        val parsed: List<NormalizedLevelRow> = mapper.readValue(rowsJson)
        assertEquals(rows.first().optionValue["value3"], parsed.first().optionValue["value3"])
        assertEquals(rows.last().level, parsed.last().level)
    }
}
