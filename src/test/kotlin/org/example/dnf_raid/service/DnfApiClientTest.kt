package org.example.dnf_raid.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.example.dnf_raid.config.DnfApiProperties
import org.junit.jupiter.api.Test
import org.springframework.web.client.RestClient

class DnfApiClientTest {

    private val mapper = ObjectMapper()

    private fun client(): DnfApiClient =
        DnfApiClient(RestClient.create(), DnfApiProperties(apiKey = "dummy"), mapper)

    @Test
    fun `parseSkillStyle should read nested style skills`() {
        val json = mapper.readTree(
            """
            {
              "skill": {
                "skills": [
                  { "skillId": "base", "name": "기본기 숙련", "option": { "level": 30 } }
                ],
                "style": {
                  "active": {
                    "skills": [
                      { "skillId": "a1", "name": "액티브1", "level": 10 },
                      { "skillId": "a2", "name": "액티브2", "level": 6 }
                    ]
                  },
                  "passive": [
                    { "skillId": "p1", "name": "패시브1", "level": 1 }
                  ]
                }
              }
            }
            """.trimIndent()
        )

        val parsed = client().parseSkillStyle(json)
        val ids = parsed.map { it.skillId }

        assertThat(ids).containsExactlyInAnyOrder("base", "a1", "a2", "p1")
        assertThat(parsed.first { it.skillId == "base" }.level).isEqualTo(30)
        assertThat(parsed.first { it.skillId == "a1" }.level).isEqualTo(10)
    }

    @Test
    fun `parseSkillStyle should deep scan unknown wrappers`() {
        val json = mapper.readTree(
            """
            {
              "skill": {
                "mysteriousNode": {
                  "inner": [
                    { "skillId": "x1", "name": "숨은스킬", "option": { "level": 5 } }
                  ]
                }
              }
            }
            """.trimIndent()
        )

        val parsed = client().parseSkillStyle(json)
        assertThat(parsed.map { it.skillId }).contains("x1")
        assertThat(parsed.first { it.skillId == "x1" }.level).isEqualTo(5)
    }
}
