package org.example.dnf_raid.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.example.dnf_raid.config.DnfApiProperties
import org.junit.jupiter.api.Test
import org.springframework.web.client.RestClient

class DnfApiClientItemParseTest {

    private val mapper = ObjectMapper()
    private fun client(): DnfApiClient =
        DnfApiClient(RestClient.create(), DnfApiProperties(apiKey = "dummy"), mapper)

    @Test
    fun `쿨타임 감소 표현식을 모두 파싱한다`() {
        val withDecreaseWord = mapper.readTree("""{ "itemExplain": "스킬 쿨타임 20% 감소" }""")
        val withMinus = mapper.readTree("""{ "itemExplain": "쿨타임 -15%" }""")
        val withReuseWord = mapper.readTree("""{ "itemExplain": "재사용 대기시간 30% 감소" }""")
        val withCooldown = mapper.readTree("""{ "itemExplain": "쿨다운 10% 감소" }""")

        val parsed1 = client().parseItemFixedOptions(withDecreaseWord)
        val parsed2 = client().parseItemFixedOptions(withMinus)
        val parsed3 = client().parseItemFixedOptions(withReuseWord)
        val parsed4 = client().parseItemFixedOptions(withCooldown)

        assertThat(parsed1.cooldownReduction).isEqualTo(0.20)
        assertThat(parsed2.cooldownReduction).isEqualTo(0.15)
        assertThat(parsed3.cooldownReduction).isEqualTo(0.30)
        assertThat(parsed4.cooldownReduction).isEqualTo(0.10)
    }
}
