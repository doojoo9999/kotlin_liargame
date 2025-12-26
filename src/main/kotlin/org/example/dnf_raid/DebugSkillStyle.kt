package org.example.dnf_raid

import org.example.dnf_raid.service.DnfApiClient
import org.springframework.boot.CommandLineRunner
import org.springframework.stereotype.Component

@Component
class DebugSkillStyle(
    private val dnfApiClient: DnfApiClient
) : CommandLineRunner {
    override fun run(vararg args: String?) {
        try {
            println("========= SKILL STYLE DEBUG START =========")
            val search = dnfApiClient.searchCharacters("all", "3기암환자")
            if (search.isEmpty()) {
                println("Character not found")
                return
            }
            val charInfo = search.first()
            println("Found Character: ${charInfo.characterName}")

            val status = dnfApiClient.fetchCharacterFullStatus(charInfo.serverId, charInfo.characterId)
            println("Skill Style Dump:")
            status.skillLevels.forEach { skill ->
                if (skill.name?.contains("라이트닝") == true || skill.enhancementType != null || skill.evolutionType != null) {
                    println("Skill [${skill.name}]: Level=${skill.level}, EnhType=${skill.enhancementType}, EvoType=${skill.evolutionType}")
                    if (skill.name?.contains("라이트닝") == true) {
                         // Lightning Dance check
                         println("  -> TARGET SKILL FOUND!")
                    }
                }
            }
            println("========= DEBUG END =========")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
