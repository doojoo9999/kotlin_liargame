package org.example.dnf_raid.service

import org.assertj.core.api.Assertions.assertThat
import org.example.kotlin_liargame.KotlinLiargameApplication
import org.junit.jupiter.api.Assumptions.assumeTrue
import org.junit.jupiter.api.Test
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource

@SpringBootTest(classes = [KotlinLiargameApplication::class])
@ActiveProfiles("test")
class DnfDamageIntegrationTest @Autowired constructor(
    private val apiClient: DnfApiClient,
    private val powerCalculator: DnfPowerCalculator
) {

    private val logger = LoggerFactory.getLogger(DnfDamageIntegrationTest::class.java)

    @Test
    fun `카인 주요 캐릭터 딜 및 버프력 스냅샷`() {
        assumeTrue(!System.getenv("DNF_API_KEY").isNullOrBlank(), "DNF_API_KEY가 설정되어야 실행됩니다.")

        val targets = listOf("3기암환자", "잘가시지", "아이돌칸나쨩", "지원금없으면")

        targets.forEach { name ->
            val search = apiClient.searchCharacters(serverId = "cain", characterName = name, limit = 5, wordType = "match")
            val hit = search.firstOrNull { it.characterName.equals(name, ignoreCase = true) } ?: search.firstOrNull()
            assumeTrue(hit != null, "캐릭터를 찾지 못했습니다: $name")

            val status = apiClient.fetchCharacterFullStatus(hit!!.serverId, hit.characterId)
            val dealer = powerCalculator.calculateDealerScore(status)
            val bufferScore = powerCalculator.calculateBufferScore(status)

            logger.info("카인/{} → 딜: {}, 버프력: {}", name, dealer.totalScore, bufferScore)

            assertThat(dealer.totalScore).isGreaterThanOrEqualTo(0.0)
            assertThat(bufferScore).isGreaterThanOrEqualTo(0L)
        }
    }

    companion object {
        @JvmStatic
        @DynamicPropertySource
        fun registerProps(registry: DynamicPropertyRegistry) {
            val env = System.getenv()
            env["DNF_API_KEY"]?.takeIf { it.isNotBlank() }?.let { key ->
                registry.add("dnf.api.api-key") { key }
            }

            val driver = env["SPRING_LOCAL_DATABASE_DRIVERCLASS"]
            val url = env["SPRING_LOCAL_DATABASE_URL"]
            val username = env["SPRING_LOCAL_DATABASE_USERNAME"]
            val password = env["SPRING_LOCAL_DATABASE_PASSWORD"]

            if (!url.isNullOrBlank() && !driver.isNullOrBlank()) {
                registry.add("spring.datasource.url") { url }
                registry.add("spring.datasource.driver-class-name") { driver }
                registry.add("spring.datasource.hikari.auto-commit") { false }
                username?.takeIf { it.isNotBlank() }?.let { registry.add("spring.datasource.username") { it } }
                password?.let { registry.add("spring.datasource.password") { it } }
            }
        }
    }
}
