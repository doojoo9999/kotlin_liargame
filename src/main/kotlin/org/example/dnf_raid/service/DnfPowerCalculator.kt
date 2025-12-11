package org.example.dnf_raid.service

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import org.example.dnf_raid.model.DnfCharacterFullStatus
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.Locale
import kotlin.math.max

@Component
class DnfPowerCalculator(
    private val objectMapper: ObjectMapper
) {

    private val logger = LoggerFactory.getLogger(DnfPowerCalculator::class.java)
    private val skillsByAdvancement: Map<String, List<SkillDefinition>> by lazy { loadSkillDb() }

    /**
        Dealer combat power = sum of top 7 skill scores.
        Score(skill) = SingleDamage * (40 / RealCD)
     */
    fun calculateDealerScore(status: DnfCharacterFullStatus): DealerCalculationResult {
        val skills = resolveSkills(status)
        if (skills.isEmpty()) {
            logger.warn("No skills found for advancement={}", status.advancementName)
            return DealerCalculationResult(totalScore = 0.0, topSkills = emptyList())
        }

        val baseAttack = maxOf(
            status.townStats.physicalAttack,
            status.townStats.magicalAttack,
            status.townStats.independentAttack
        ).toDouble()
        val totalStrength = status.townStats.strength.toDouble()
        val totalIntelligence = status.townStats.intelligence.toDouble()
        val mainStat = max(totalStrength, totalIntelligence)
        val statFactor = 1.0 + (mainStat / 250.0)

        // 2025 Season: Set Point System (Replaces Damage Value)
        // Set Points determine the "Set Option" Final Damage Multiplier.
        val totalSetPoints = status.equipment.sumOf { it.setPoint }
        val setPointMultiplier = org.example.dnf_raid.model.SetEffectTable.getDamageMultiplier(totalSetPoints)

        // Skill Attack (Final Damage Increase) - Multiplicative (Compound)
        // Equipment + Creature + Avatar if applicable
        var totalSkillAtkMultiplier = status.equipment.fold(1.0) { acc, item ->
            acc * (1.0 + item.fixedOptions.skillAtkIncrease)
        }
        
        // Creature Damage Increase (often termed 'Damage Increase' or 'Skill Atk' depending on season)
        // If creature.damageBonus is a percentage (e.g. 20 for 20%), convert to multiplier
        status.creature?.let { creature ->
            if (creature.damageBonus > 0) {
                totalSkillAtkMultiplier *= (1.0 + creature.damageBonus / 100.0)
            }
        }

        val totalCdr = 1.0 - status.equipment.fold(1.0) { acc, item ->
            acc * (1.0 - item.fixedOptions.cooldownReduction)
        }.coerceAtLeast(0.0)

        val totalRecovery = status.equipment.sumOf { it.fixedOptions.cooldownRecovery }

        val skillScores = skills.map { skill ->
            val levelOptions = status.equipment.mapNotNull { it.fixedOptions.levelOptions[skill.level] }
            val specificSkillAtk = levelOptions.fold(1.0) { acc, opt -> acc * (1.0 + opt.skillAtkInc) }
            val specificCdr = 1.0 - levelOptions.fold(1.0) { acc, opt -> acc * (1.0 - opt.cdr) }.coerceAtLeast(0.0)

            // Calculate Elemental Multiplier: (1.0 + (HighestElement + 11) / 222.0)
            val highestElement = maxOf(
                status.townStats.elementInfo.fire,
                status.townStats.elementInfo.water,
                status.townStats.elementInfo.light,
                status.townStats.elementInfo.shadow
            )
            // 11 is the hidden approximate elemental damage derived from base character stats
            // Formula: 1 + (Elem + 11) * 0.0045
            val elementalMultiplier = 1.0 + (highestElement + 11) * 0.0045

            val singleDamage = baseAttack *
                statFactor *
                setPointMultiplier * // Main Set Option Multiplier
                totalSkillAtkMultiplier *
                elementalMultiplier * 
                specificSkillAtk *
                skill.coeff *
                1.5 * // Base Critical Damage (Assuming 100% Crit Rate)
                1.25  // Counter Damage (Standard Raid Assumption)

            val realCd = (skill.baseCd) *
                (1.0 - totalCdr).coerceAtLeast(MIN_CD_FACTOR) *
                (1.0 - specificCdr).coerceAtLeast(MIN_CD_FACTOR) /
                (1.0 + totalRecovery)

            val castCount = 40.0 / realCd
            val score = singleDamage * castCount

            SkillScore(
                name = skill.name,
                level = skill.level,
                coeff = skill.coeff,
                baseCd = skill.baseCd,
                realCd = realCd,
                singleDamage = singleDamage,
                casts = castCount,
                score = score
            )
        }.sortedByDescending { it.score }

        val topSkills = skillScores.take(7)
        val totalScore = topSkills.sumOf { it.score }

        return DealerCalculationResult(
            totalScore = totalScore,
            topSkills = topSkills
        )
    }

    /**
     * Buffer score (Dundam-style reference dealer model).
     * Returns 0 for non-buffer classes.
     */
    fun calculateBufferScore(status: DnfCharacterFullStatus): Long {
        if (!isBufferClass(status)) return 0L

        val bufferStat = resolveBufferStat(status).toDouble()
        val totalBuffPower = resolveBuffPower(status).toDouble()

        val statIncrease = (totalBuffPower / STAT_BUFF_DIVISOR) * (1 + bufferStat / BUFFER_STAT_NORMALIZER)
        val atkIncrease = (totalBuffPower / ATK_BUFF_DIVISOR) * (1 + bufferStat / BUFFER_STAT_NORMALIZER)

        val finalStat = REF_STAT + statIncrease
        val finalAtk = REF_ATK + atkIncrease

        // 2025 Season: Set Point Buff Multiplier
        val totalSetPoints = status.equipment.sumOf { it.setPoint }
        val setMultiplier = org.example.dnf_raid.model.SetEffectTable.getBuffMultiplier(totalSetPoints)

        val score = (finalStat / REF_STAT) * (finalAtk / REF_ATK) * BASE_POTENTIAL * setMultiplier
        return score.toLong()
    }

    private fun resolveSkills(status: DnfCharacterFullStatus): List<SkillDefinition> {
        val key = status.advancementName.lowercase(Locale.getDefault())
        val jobKey = status.jobName.lowercase(Locale.getDefault())
        return skillsByAdvancement[key]
            ?: skillsByAdvancement[jobKey]
            ?: emptyList()
    }

    private fun isBufferClass(status: DnfCharacterFullStatus): Boolean {
        val adv = status.advancementName.lowercase(Locale.getDefault())
        val job = status.jobName.lowercase(Locale.getDefault())
        return listOf(adv, job).any { name ->
            name.contains("크루세이더") ||
                name.contains("crusader") ||
                name.contains("세인트") ||
                name.contains("세라핌") ||
                name.contains("인챈트리스") ||
                name.contains("enchantress") ||
                name.contains("뮤즈") ||
                name.contains("muse") ||
                name.contains("패러메딕") ||
                name.contains("paramedic")
        }
    }

    private fun resolveBufferStat(status: DnfCharacterFullStatus): Long =
        listOf(
            status.townStats.intelligence,
            status.townStats.vitality,
            status.townStats.spirit
        ).maxOrNull() ?: 0L

    private fun resolveBuffPower(status: DnfCharacterFullStatus): Long {
        val equipmentBuff = status.equipment.sumOf { it.buffPower }
        val avatarBuff = status.avatars.sumOf {
            if (it.buffPower > 0) it.buffPower else extractBuffPower(it.emblems.joinToString(" "))
        }
        val creatureBuff = status.creature?.let {
            when {
                it.buffPower > 0 -> it.buffPower
                else -> extractBuffPower(it.artifactStats.joinToString(" "))
            }
        } ?: 0L
        // Titles / auras that come through as equipment (slotName == "TITLE" or "AURA") are included in equipmentBuff.
        return equipmentBuff + avatarBuff + creatureBuff
    }

    private fun extractBuffPower(text: String): Long {
        if (text.isBlank()) return 0L
        val match = BUFF_PATTERN.find(text.lowercase(Locale.getDefault())) ?: return 0L
        val raw = match.groupValues.getOrNull(1)?.replace(",", "") ?: return 0L
        return raw.toLongOrNull() ?: 0L
    }

    private fun loadSkillDb(): Map<String, List<SkillDefinition>> {
        val resource = javaClass.classLoader.getResourceAsStream("dnf/skill_db.json")
        if (resource == null) {
            logger.warn("skill_db.json not found on classpath (dnf/skill_db.json)")
            return emptyMap()
        }

        return runCatching {
            resource.use { input ->
                val type = object : TypeReference<Map<String, List<SkillDefinition>>>() {}
                objectMapper.readValue<Map<String, List<SkillDefinition>>>(input, type)
            }
        }.getOrElse { ex ->
            logger.warn("Failed to load skill_db.json: {}", ex.message)
            emptyMap()
        }
    }

    data class DealerCalculationResult(
        val totalScore: Double,
        val topSkills: List<SkillScore>
    )

    data class SkillScore(
        val name: String,
        val level: Int,
        val coeff: Double,
        val baseCd: Double,
        val realCd: Double,
        val singleDamage: Double,
        val casts: Double,
        val score: Double
    )

    data class SkillDefinition(
        val name: String,
        val level: Int,
        val coeff: Double,
        val baseCd: Double
    )

    companion object {
        // Max Cooltime Reduction is 70% -> Min Cooltime Factor is 30%
        private const val MIN_CD_FACTOR = 0.3
        private const val REF_STAT = 25250.0
        private const val REF_ATK = 3000.0
        private const val BASE_POTENTIAL = 30750.0
        private const val STAT_BUFF_DIVISOR = 20.0
        private const val ATK_BUFF_DIVISOR = 200.0
        private const val BUFFER_STAT_NORMALIZER = 6000.0
        private val BUFF_PATTERN = Regex("""(?:버프|buff)[^\\d-]*([\\d,]+)""", RegexOption.IGNORE_CASE)
    }
}
