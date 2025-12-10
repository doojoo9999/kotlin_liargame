package org.example.dnf_raid.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonTypeRef
import com.fasterxml.jackson.module.kotlin.readValue
import org.example.dnf_raid.model.DnfAvatar
import org.example.dnf_raid.model.DnfCharacterFullStatus
import org.example.dnf_raid.model.JobRole
import org.example.dnf_raid.model.TownStats
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.Locale
import kotlin.math.max

@Component
class DnfPowerCalculator(
    private val objectMapper: ObjectMapper
) {

    private val logger = LoggerFactory.getLogger(DnfPowerCalculator::class.java)
    private val skillDb: Map<String, List<SkillDefinition>> by lazy { loadSkillDb() }

    fun calculate(status: DnfCharacterFullStatus): CalculationResult =
        when (status.basicInfo.role) {
            JobRole.DEALER -> calculateDealer(status)
            JobRole.BUFFER -> calculateBuffer(status)
        }

    private fun calculateDealer(status: DnfCharacterFullStatus): CalculationResult {
        val mainStat = max(status.townStats.strength, status.townStats.intelligence).toDouble()
        val statMultiplier = 1 + (mainStat / 250.0)

        val elementalValue = aggregateElementalDamage(status)
        val elementalMultiplier = 1.05 + (elementalValue / 222.0)

        val totalDamageValue = status.equipment.sumOf { it.growthDamageValue } + (status.creature?.damageBonus ?: 0)
        val damageMultiplier = 1 + (totalDamageValue / 20000.0)

        val skillAtkProduct = status.equipment.fold(1.0) { acc, item ->
            acc * (1 + item.fixedOptions.skillAtkInc)
        }

        val totalCdr = status.equipment.sumOf { it.fixedOptions.cooldownReduction }
            .coerceIn(0.0, 0.9)

        val skills = findSkills(status)
        if (skills.isEmpty()) {
            logger.warn("스킬 DB에 매칭되는 직업이 없습니다: job={}, adv={}", status.basicInfo.jobName, status.basicInfo.advancement)
            return CalculationResult(role = JobRole.DEALER, score = 0.0)
        }

        val skillScores = skills.map { def ->
            val skillDamage = def.baseCoefficient * statMultiplier * elementalMultiplier * damageMultiplier * skillAtkProduct
            val cdFactor = (1 - totalCdr).coerceAtLeast(0.05)
            val realCooldown = def.baseCooldown * cdFactor / (1 + def.recovery)
            val throughput = skillDamage * (40.0 / realCooldown)
            SkillScore(
                name = def.name,
                throughput = throughput,
                realCooldown = realCooldown,
                baseCoefficient = def.baseCoefficient,
                baseCooldown = def.baseCooldown,
                skillDamage = skillDamage
            )
        }.sortedByDescending { it.throughput }

        val topSkills = skillScores.take(7)
        val finalScore = topSkills.sumOf { it.throughput }

        return CalculationResult(
            role = JobRole.DEALER,
            score = finalScore,
            skills = topSkills
        )
    }

    private fun calculateBuffer(status: DnfCharacterFullStatus): CalculationResult {
        val jobKey = listOf(status.basicInfo.jobName, status.basicInfo.advancement)
            .firstOrNull { it.isNotBlank() }
            ?.lowercase(Locale.getDefault())
            ?: ""

        val mainStatValue = getBufferStat(jobKey, status.townStats)
        val totalBuffPower = totalBuffPower(status)

        val statFactor = (mainStatValue / 620.0) + 1
        val finalBuffScore = statFactor * totalBuffPower

        return CalculationResult(
            role = JobRole.BUFFER,
            score = finalBuffScore,
            totalBuffPower = totalBuffPower,
            mainStat = mainStatValue.toLong()
        )
    }

    private fun totalBuffPower(status: DnfCharacterFullStatus): Long {
        val equipmentBuff = status.equipment.sumOf { it.growthBuffPower }
        val creatureBuff = status.creature?.buffPower ?: 0
        val avatarBuff = extractBuffFromAvatar(status.avatar)
        val fallbackTownBuff = status.townStats.buffScore ?: 0

        val summed = equipmentBuff + creatureBuff + avatarBuff
        return if (summed > 0) summed else fallbackTownBuff
    }

    private fun aggregateElementalDamage(status: DnfCharacterFullStatus): Double =
        status.equipment.sumOf { it.fixedOptions.elementalDamage }.toDouble()

    private fun extractBuffFromAvatar(avatar: List<DnfAvatar>): Long =
        avatar.sumOf { AVATAR_BUFF_PATTERN.find(it.optionSummary)?.groupValues?.getOrNull(1)?.replace(",", "")?.toLongOrNull() ?: 0L }

    private fun findSkills(status: DnfCharacterFullStatus): List<SkillDefinition> {
        val keys = listOf(
            status.basicInfo.advancement.lowercase(Locale.getDefault()),
            status.basicInfo.jobName.lowercase(Locale.getDefault())
        )
        keys.forEach { key ->
            val candidate = skillDb[key]
            if (!candidate.isNullOrEmpty()) return candidate
        }
        return emptyList()
    }

    private fun getBufferStat(jobNameLower: String, townStats: TownStats): Double = when {
        jobNameLower.contains("크루세이더") || jobNameLower.contains("crusader") ->
            max(townStats.vitality, townStats.spirit).toDouble()
        jobNameLower.contains("인챈트리스") || jobNameLower.contains("enchantress") ||
            jobNameLower.contains("뮤즈") || jobNameLower.contains("muse") ->
            townStats.intelligence.toDouble()
        else -> townStats.intelligence.toDouble()
    }

    private fun loadSkillDb(): Map<String, List<SkillDefinition>> {
        val resource = javaClass.classLoader.getResourceAsStream("dnf/skill_db.json")
            ?: run {
                logger.warn("skill_db.json 리소스를 찾을 수 없습니다. (classpath:dnf/skill_db.json)")
                return emptyMap()
            }

        return runCatching {
            resource.use { input ->
                val skills: List<SkillDefinition> = objectMapper.readValue(input, jacksonTypeRef<List<SkillDefinition>>())
                skills.groupBy { it.job.lowercase(Locale.getDefault()) }
            }
        }.getOrElse { ex ->
            logger.warn("스킬 DB 로드 실패: {}", ex.message)
            emptyMap()
        }
    }

    data class CalculationResult(
        val role: JobRole,
        val score: Double,
        val skills: List<SkillScore> = emptyList(),
        val totalBuffPower: Long? = null,
        val mainStat: Long? = null
    )

    data class SkillScore(
        val name: String,
        val throughput: Double,
        val realCooldown: Double,
        val baseCoefficient: Double,
        val baseCooldown: Double,
        val skillDamage: Double
    )

    data class SkillDefinition(
        val job: String,
        val name: String,
        val baseCoefficient: Double,
        val baseCooldown: Double,
        val recovery: Double = 0.0
    )

    companion object {
        private val AVATAR_BUFF_PATTERN = Regex("""버프력\s*([\d,]+)""", RegexOption.IGNORE_CASE)
    }
}
