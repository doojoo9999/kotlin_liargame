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
class DnfDamageVerificationTest @Autowired constructor(
    private val apiClient: DnfApiClient,
    private val powerCalculator: DnfPowerCalculator
) {

    private val logger = LoggerFactory.getLogger(DnfDamageVerificationTest::class.java)

    @Test
    fun `Print Detailed Damage Report`() {
        val apiKey = System.getenv("DNF_API_KEY")
        if (apiKey.isNullOrBlank()) {
             logger.warn("SKIPPING TEST: DNF_API_KEY not found in environment")
             return
        }

        // Target Character: "잘가시지" (User's Striker)
        val targetName = "잘가시지"
        val serverId = "cain"

        logger.info("=== STARTING DAMAGE VERIFICATION FOR $targetName ===")
        
        // 1. Search
        val search = apiClient.searchCharacters(serverId, targetName, limit = 5, wordType = "match")
        val hit = search.firstOrNull()
        if (hit == null) {
            logger.error("Character not found: $targetName")
            return
        }
        
        // 2. Fetch Status
        val status = apiClient.fetchCharacterFullStatus(hit.serverId, hit.characterId)
        
        // 3. Calculate
        val result = powerCalculator.calculateDealerScore(status)
        
        // 4. Print Report
        val sb = StringBuilder()
        sb.appendLine("\n")
        sb.appendLine("=================================================================================")
        sb.appendLine("DAMAGE REPORT [RAW DAMAGE MODE] for $targetName")
        sb.appendLine("Total Score: ${String.format("%,.0f", result.totalScore)}")
        sb.appendLine("=================================================================================")
        
        result.topSkills.forEachIndexed { index, skill ->
            sb.appendLine("#${index + 1} ${skill.name} (Lv.${skill.level})")
            sb.appendLine("   Stats: BaseCD=${String.format("%.1fs", skill.baseCd)} -> RealCD=${String.format("%.1fs", skill.realCd)}")
            sb.appendLine("   Hit Damage: ${String.format("%,.0f", skill.singleDamage)}")
            sb.appendLine("   Casts: ${skill.casts}")
            sb.appendLine("   Total: ${String.format("%,.0f", skill.score)}")
            sb.appendLine("---------------------------------------------------------------------------------")
        }
        sb.appendLine("=================================================================================\n")
        
        logger.error(sb.toString()) // Use ERROR log level to ensure visibility in standard output logs
        println(sb.toString())
    }

    companion object {
        @JvmStatic
        @DynamicPropertySource
        fun registerProps(registry: DynamicPropertyRegistry) {
             System.getenv("DNF_API_KEY")?.let { key ->
                 registry.add("dnf.api.api-key") { key }
             }
             // Helper for local env without complete DB setup, though SpringBootTest usually needs it.
             // Relying on properties or assume environment has DB connection.
        }
    }
}
