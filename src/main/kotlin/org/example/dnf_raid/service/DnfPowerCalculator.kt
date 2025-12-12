package org.example.dnf_raid.service

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import org.example.dnf_raid.model.DnfCharacterFullStatus
import org.example.dnf_raid.model.ItemFixedOptions
import org.example.dnf_raid.model.LevelOption
import org.example.dnf_raid.model.CharacterSkillLevel
import org.example.dnf_raid.model.DnfSkillEntity
import org.example.dnf_raid.repository.DnfSkillRepository
import org.example.dnf_raid.service.DnfSkillCatalogService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.Locale
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.max

@Component
class DnfPowerCalculator(
    private val objectMapper: ObjectMapper,
    private val skillRepository: DnfSkillRepository,
    private val skillCatalogService: DnfSkillCatalogService,
    private val skillCalculationService: SkillCalculationService
) {

    private val logger = LoggerFactory.getLogger(DnfPowerCalculator::class.java)
    private val skillsByAdvancement: Map<String, List<SkillDefinition>> by lazy { loadSkillDb() }
    private val syncLock = ConcurrentHashMap.newKeySet<String>()

    /**
        Dealer combat power = sum of top 7 skill scores.
        Score(skill) = SingleDamage * (40 / RealCD)
        Based on docs/dnf/damage_formula_2025.md lanes.
     */
    fun calculateDealerScore(
        status: DnfCharacterFullStatus,
        monsterResist: Int = 0,
        situationalBonus: Double = DEFAULT_SITUATIONAL_BONUS,
        partySynergyBonus: Double = DEFAULT_PARTY_SYNERGY_BONUS
    ): DealerCalculationResult {
        val skills = resolveSkills(status)
        if (skills.isEmpty()) {
            logger.warn("No skills found for advancement={}", status.advancementName)
            return DealerCalculationResult(totalScore = 0.0, topSkills = emptyList())
        }
        val filteredSkills = applySkillFilters(skills, status.skillLevels)
        val usableSkills = filteredSkills.ifEmpty { skills }

        val baseAttack = maxOf(
            status.townStats.physicalAttack,
            status.townStats.magicalAttack,
            status.townStats.independentAttack
        ).toDouble()
        val totalStrength = status.townStats.strength.toDouble()
        val totalIntelligence = status.townStats.intelligence.toDouble()
        val mainStat = max(totalStrength, totalIntelligence)
        val statFactor = 1.0 + (mainStat / 250.0)

        val laneTotals = aggregateLaneTotals(status)
        val baseElementalAttack = resolveBaseElementalAttack(status)

        val totalCdr = calculateStackedReduction(status.equipment.map { it.fixedOptions.cooldownReduction })
        val totalRecovery = status.equipment.sumOf { it.fixedOptions.cooldownRecovery }

        val skillScores = usableSkills.map { skill ->
            val levelOptions = status.equipment.mapNotNull { it.fixedOptions.levelOptions[skill.level] }
            val levelLanes = aggregateLevelLanes(levelOptions)
            val mergedLane = laneTotals + levelLanes

            val skillAtkMultiplier = 1.0 + mergedLane.skillAtk
            val damageIncreaseMultiplier = 1.0 + mergedLane.damageIncrease
            val additionalDamageMultiplier = 1.0 + mergedLane.additionalDamage
            val finalDamageMultiplier = 1.0 + mergedLane.finalDamage
            val criticalMultiplier = CRIT_BASE * (1.0 + mergedLane.criticalDamage)
            val elementalAttack = baseElementalAttack + BASE_ELEMENTAL_FLAT + mergedLane.elementalAttackBonus // base hidden +11 plus gear elemental
            val elementalMultiplier = (1.0 + ((elementalAttack - monsterResist) * ELEMENT_COEFF)).coerceAtLeast(0.0)
            val situationalMultiplier = 1.0 + situationalBonus
            val partyMultiplier = 1.0 + partySynergyBonus
            val defenseMultiplier = 1.0 + mergedLane.defensePenetration

            val baseSkillDamage = baseAttack * skill.coeff
            val totalMultiplier = statFactor *
                defenseMultiplier *
                skillAtkMultiplier *
                damageIncreaseMultiplier *
                additionalDamageMultiplier *
                finalDamageMultiplier *
                criticalMultiplier *
                elementalMultiplier *
                situationalMultiplier *
                partyMultiplier

            val singleDamage = baseSkillDamage * totalMultiplier

            val specificCdr = calculateStackedReduction(levelOptions.map { it.cdr })

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
                score = score,
                breakdown = DamageBreakdown(
                    baseSkillDamage = baseSkillDamage,
                    statMultiplier = statFactor,
                    defenseMultiplier = defenseMultiplier,
                    skillAtkMultiplier = skillAtkMultiplier,
                    damageIncreaseMultiplier = damageIncreaseMultiplier,
                    additionalDamageMultiplier = additionalDamageMultiplier,
                    finalDamageMultiplier = finalDamageMultiplier,
                    criticalMultiplier = criticalMultiplier,
                    elementalMultiplier = elementalMultiplier,
                    situationalMultiplier = situationalMultiplier,
                    partyMultiplier = partyMultiplier,
                    totalMultiplier = totalMultiplier,
                    totalDamage = singleDamage
                )
            )
        }.sortedByDescending { it.score }

        val topSkills = skillScores.take(7)
        val totalScore = topSkills.sumOf { it.score }

        if (totalScore <= 0.0) {
            logger.warn(
                "Dealer score is zero despite skills. advancement={}, job={}, baseAtk={}, str={}, int={}, skillCount={}",
                status.advancementName,
                status.jobName,
                baseAttack,
                totalStrength,
                totalIntelligence,
                skillScores.size
            )
        }

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

    private fun aggregateLaneTotals(status: DnfCharacterFullStatus): LaneTotals {
        val fromEquipment = status.equipment.fold(LaneTotals()) { acc, item ->
            acc + laneFromOptions(item.fixedOptions)
        }
        val creatureLane = status.creature?.let { creature ->
            if (creature.damageBonus > 0) {
                LaneTotals(damageIncrease = creature.damageBonus / 100.0)
            } else {
                LaneTotals()
            }
        } ?: LaneTotals()

        val totalSetPoints = status.equipment.sumOf { it.setPoint }
        val setBonus = org.example.dnf_raid.model.SetEffectTable.getDamageMultiplier(totalSetPoints) - 1.0

        return fromEquipment + creatureLane + LaneTotals(finalDamage = setBonus)
    }

    private fun laneFromOptions(options: ItemFixedOptions): LaneTotals =
        LaneTotals(
            skillAtk = options.skillAtkIncrease,
            damageIncrease = options.damageIncrease,
            additionalDamage = options.additionalDamage,
            finalDamage = options.finalDamage,
            criticalDamage = options.criticalDamage,
            elementalAttackBonus = options.elementalDamage,
            defensePenetration = options.defensePenetration
        )

    private fun aggregateLevelLanes(levelOptions: List<LevelOption>): LaneTotals =
        levelOptions.fold(LaneTotals()) { acc, opt ->
            acc + LaneTotals(
                skillAtk = opt.skillAtkInc,
                damageIncrease = opt.damageIncrease,
                additionalDamage = opt.additionalDamage,
                finalDamage = opt.finalDamage,
                criticalDamage = opt.criticalDamage
        )
    }

    private fun fetchSkillsFromDb(keys: List<String>): List<SkillDefinition> {
        keys.forEach { key ->
            val byAdvancement = skillRepository.findByJobGrowNameIgnoreCase(key)
            if (byAdvancement.isNotEmpty()) {
                return byAdvancement.mapNotNull { it.toSkillDefinition(objectMapper) }
                    .sortedByDescending { it.level }
                    .take(20)
            }

            val byJob = skillRepository.findByJobNameIgnoreCase(key)
            if (byJob.isNotEmpty()) {
                return byJob.mapNotNull { it.toSkillDefinition(objectMapper) }
                    .sortedByDescending { it.level }
                    .take(20)
            }
        }
        return emptyList()
    }

    private fun DnfSkillEntity.toSkillDefinition(mapper: ObjectMapper): SkillDefinition? {
        val rows = parseLevelRows(mapper)
        val best = rows.maxByOrNull { it.level ?: 0 }
        val coeff = best?.let { row ->
            val fromTemplate = skillCalculationService.calculateTotalDamagePercent(optionDesc, row.optionValue)
            if (fromTemplate > 0) {
                skillCalculationService.toSkillCoefficient(fromTemplate)
            } else {
                val metrics = extractOptionMetrics(optionDesc, row.optionValue)
                val numericValues = row.optionValue
                    .values
                val damage = when {
                    metrics.damageValues.isNotEmpty() -> metrics.damageValues.maxOrNull() ?: 1.0
                    numericValues.isNotEmpty() -> numericValues.maxOrNull() ?: 1.0
                    else -> 1.0
                }
                val hits = metrics.hitCounts.maxOrNull()?.coerceAtLeast(1.0) ?: 1.0
                val stacks = metrics.stackCounts.maxOrNull()?.coerceAtLeast(1.0) ?: 1.0
                normalizeCoeff(damage) * hits * stacks
            }
        } ?: 1.0
        val cd = best?.coolTime ?: this.baseCoolTime ?: DEFAULT_BASE_CD
        val level = best?.level ?: this.requiredLevel ?: this.maxLevel ?: 0
        return SkillDefinition(
            skillId = this.skillId,
            name = this.skillName,
            skillType = this.skillType,
            level = level,
            coeff = coeff,
            baseCd = cd
        )
    }
    
    private fun DnfSkillEntity.parseLevelRows(mapper: ObjectMapper): List<NormalizedLevelRow> {
        val json = this.levelRowsJson ?: return emptyList()
        return runCatching {
            mapper.readValue(json, object : TypeReference<List<NormalizedLevelRow>>() {})
        }.getOrElse { ex ->
            logger.warn("Failed to parse levelRows for skillId={} (jobGrowId={}): {}", this.skillId, this.jobGrowId, ex.message)
            emptyList()
        }
    }

    private fun extractOptionMetrics(optionDesc: String?, optionValue: Map<String, Double>?): OptionMetrics {
        if (optionDesc.isNullOrBlank() || optionValue == null) return OptionMetrics()
        val regex = Regex("""\{(value\d+)\}""")
        val matches = regex.findAll(optionDesc)
        val damage = mutableListOf<Double>()
        val hits = mutableListOf<Double>()
        val stacks = mutableListOf<Double>()
        matches.forEach { match ->
            val key = match.groupValues.getOrNull(1) ?: return@forEach
            val idx = match.range.first
            val windowStart = (idx - 15).coerceAtLeast(0)
            val windowEnd = (idx + 25).coerceAtMost(optionDesc.length)
            val window = optionDesc.substring(windowStart, windowEnd)
            val num = optionValue[key] ?: return@forEach
            val lower = window.lowercase(Locale.getDefault())
            when {
                HIT_KEYWORDS.any { lower.contains(it) } -> hits += num
                STACK_KEYWORDS.any { lower.contains(it) } -> stacks += num
                DAMAGE_KEYWORDS.any { lower.contains(it) } -> damage += num
                else -> damage += num
            }
        }
        return OptionMetrics(damageValues = damage, hitCounts = hits, stackCounts = stacks)
    }

    private fun normalizeCoeff(raw: Double): Double {
        return when {
            raw > 5000 -> raw / 100.0  // e.g. 12694% -> 126.94
            raw > 500 -> raw / 10.0
            else -> raw
        }
    }

    private fun resolveBaseElementalAttack(status: DnfCharacterFullStatus): Int =
        maxOf(
            status.townStats.elementInfo.fire,
            status.townStats.elementInfo.water,
            status.townStats.elementInfo.light,
            status.townStats.elementInfo.shadow
        )

    private fun calculateStackedReduction(values: List<Double>): Double =
        1.0 - values.fold(1.0) { acc, value ->
            acc * (1.0 - value)
        }.coerceAtLeast(0.0)

    private fun resolveSkills(status: DnfCharacterFullStatus): List<SkillDefinition> {
        val keys = candidateKeys(status)

        val fileSkills = keys.asSequence()
            .mapNotNull { skillsByAdvancement[it] }
            .firstOrNull { it.isNotEmpty() }
        if (fileSkills != null) return fileSkills

        val dbSkills = fetchSkillsFromDb(keys)
        if (dbSkills.isNotEmpty()) {
            logger.info("Loaded skills from DB for advancement/job: {} / {}", status.advancementName, status.jobName)
            return dbSkills
        }

        val normalizedAdvancement = normalizeKey(status.advancementName)
        if (syncLock.add(normalizedAdvancement)) {
            val synced = runCatching {
                skillCatalogService.refreshByNames(status.jobName, status.advancementName)
            }.onFailure { ex ->
                logger.warn("Skill catalog sync failed for advancement={} : {}", status.advancementName, ex.message)
            }.getOrDefault(false)

            if (synced) {
                val refreshed = fetchSkillsFromDb(keys)
                if (refreshed.isNotEmpty()) {
                    logger.info("Skills synced on-demand for advancement={} ({} skills)", status.advancementName, refreshed.size)
                    return refreshed
                }
            }

            if (!synced) {
                syncLock.remove(normalizedAdvancement)
            }
        }

        return emptyList()
    }

    private fun applySkillFilters(skills: List<SkillDefinition>, styleLevels: List<CharacterSkillLevel>): List<SkillDefinition> {
        val byStyle = filterBySkillStyle(skills, styleLevels)
        val damageOnly = byStyle.filter { isDamageSkill(it) }
        return damageOnly.ifEmpty { byStyle }
    }

    private fun filterBySkillStyle(skills: List<SkillDefinition>, styleLevels: List<CharacterSkillLevel>): List<SkillDefinition> {
        if (styleLevels.isEmpty()) return skills

        val levelsById = styleLevels.associate { it.skillId to it.level }
        val levelsByName = styleLevels.mapNotNull { entry ->
            entry.name?.let { normalizeKey(it) to entry.level }
        }.toMap()

        val filtered = skills.filter { def ->
            val level = def.skillId?.let { levelsById[it] } ?: levelsByName[normalizeKey(def.name)]
            level != null && level > 0
        }

        if (filtered.isEmpty()) {
            logger.info("Skill style filter removed all skills; reverting to full list (styleCount={})", styleLevels.size)
        }
        return filtered.ifEmpty { skills }
    }

    private fun isDamageSkill(skill: SkillDefinition): Boolean {
        val type = skill.skillType?.lowercase(Locale.getDefault()) ?: return true
        if (type.contains("passive") || type.contains("패시브")) return false
        if (type.contains("buff") || type.contains("버프")) return false
        if (type.contains("support") || type.contains("지원") || type.contains("보조")) return false
        if (type.contains("defense") || type.contains("방어")) return false
        return true
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

        val raw = runCatching {
            resource.use { input ->
                val type = object : TypeReference<Map<String, List<SkillDefinition>>>() {}
                objectMapper.readValue<Map<String, List<SkillDefinition>>>(input, type)
            }
        }.getOrElse { ex ->
            logger.warn("Failed to load skill_db.json: {}", ex.message)
            emptyMap()
        }

        return raw.flatMap { (name, defs) ->
            val normalized = normalizeKey(name)
            listOf(
                name.lowercase(Locale.getDefault()) to defs,
                normalized to defs
            )
        }.toMap()
    }

    private fun candidateKeys(status: DnfCharacterFullStatus): List<String> =
        listOf(
            status.advancementName,
            status.jobName,
            normalizeKey(status.advancementName),
            normalizeKey(status.jobName)
        ).filter { it.isNotBlank() }
            .map { it.lowercase(Locale.getDefault()) }
            .distinct()

    private fun normalizeKey(name: String?): String =
        name.orEmpty()
            .replaceFirst(Regex("^眞\\s*"), "")
            .replaceFirst(Regex("^진\\s*"), "")
            .trim()
            .lowercase(Locale.getDefault())

    data class DamageBreakdown(
        val baseSkillDamage: Double,
        val statMultiplier: Double,
        val defenseMultiplier: Double,
        val skillAtkMultiplier: Double,
        val damageIncreaseMultiplier: Double,
        val additionalDamageMultiplier: Double,
        val finalDamageMultiplier: Double,
        val criticalMultiplier: Double,
        val elementalMultiplier: Double,
        val situationalMultiplier: Double,
        val partyMultiplier: Double,
        val totalMultiplier: Double,
        val totalDamage: Double
    )

    data class LaneTotals(
        val skillAtk: Double = 0.0,
        val damageIncrease: Double = 0.0,
        val additionalDamage: Double = 0.0,
        val finalDamage: Double = 0.0,
        val criticalDamage: Double = 0.0,
        val elementalAttackBonus: Int = 0,
        val defensePenetration: Double = 0.0
    ) {
        operator fun plus(other: LaneTotals): LaneTotals = LaneTotals(
            skillAtk = skillAtk + other.skillAtk,
            damageIncrease = damageIncrease + other.damageIncrease,
            additionalDamage = additionalDamage + other.additionalDamage,
            finalDamage = finalDamage + other.finalDamage,
            criticalDamage = criticalDamage + other.criticalDamage,
            elementalAttackBonus = elementalAttackBonus + other.elementalAttackBonus,
            defensePenetration = defensePenetration + other.defensePenetration
        )
    }

    private data class OptionMetrics(
        val damageValues: List<Double> = emptyList(),
        val hitCounts: List<Double> = emptyList(),
        val stackCounts: List<Double> = emptyList()
    )

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
        val score: Double,
        val breakdown: DamageBreakdown
    )

    data class SkillDefinition(
        val skillId: String? = null,
        val name: String,
        val skillType: String? = null,
        val level: Int,
        val coeff: Double,
        val baseCd: Double
    )

    companion object {
        // Max Cooltime Reduction is 70% -> Min Cooltime Factor is 30%
        private const val MIN_CD_FACTOR = 0.3
        private const val ELEMENT_COEFF = 0.0045
        private const val BASE_ELEMENTAL_FLAT = 11
        private const val CRIT_BASE = 1.5
        private const val DEFAULT_SITUATIONAL_BONUS = 0.25
        private const val DEFAULT_PARTY_SYNERGY_BONUS = 0.0
        private const val DEFAULT_BASE_CD = 1.0
        private const val REF_STAT = 25250.0
        private const val REF_ATK = 3000.0
        private const val BASE_POTENTIAL = 30750.0
        private const val STAT_BUFF_DIVISOR = 20.0
        private const val ATK_BUFF_DIVISOR = 200.0
        private const val BUFFER_STAT_NORMALIZER = 6000.0
        private val BUFF_PATTERN = Regex("""(?:버프|buff)[^\\d-]*([\\d,]+)""", RegexOption.IGNORE_CASE)
        private val DAMAGE_KEYWORDS = listOf("공격", "피해", "데미지", "%", "damage", "attack")
        private val HIT_KEYWORDS = listOf("타격", "히트", "타수", "hit")
        private val STACK_KEYWORDS = listOf("스택", "stack", "중첩")
    }
}
