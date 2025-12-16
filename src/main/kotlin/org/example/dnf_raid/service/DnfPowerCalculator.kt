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
import org.example.dnf_raid.service.NormalizedSkillDetail
import org.example.dnf_raid.model.LaneTotals
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

        val passiveLane = aggregatePassiveLanes(status.skillLevels)
        val laneTotals = aggregateLaneTotals(status, passiveLane)
        val baseElementalAttack = resolveBaseElementalAttack(status)

        val totalCdr = calculateStackedReduction(
            status.equipment.map { it.fixedOptions.cooldownReduction } + passiveLane.cooldownReduction
        )
        val totalRecovery = status.equipment.sumOf { it.fixedOptions.cooldownRecovery } + passiveLane.cooldownRecovery

        val skillScores = usableSkills.map { skill ->
            val levelOptions = status.equipment.mapNotNull { it.fixedOptions.levelOptions[skill.level] }
            val levelLanes = aggregateLevelLanes(levelOptions)
            val mergedLane = laneTotals + levelLanes + skill.laneBonus

            val skillAtkMultiplier = 1.0 + mergedLane.skillAtk
            val damageIncreaseMultiplier = 1.0 + mergedLane.damageIncrease
            val additionalDamageMultiplier = 1.0 + mergedLane.additionalDamage
            val finalDamageMultiplier = 1.0 + mergedLane.finalDamage
            val criticalMultiplier = CRIT_BASE * (1.0 + mergedLane.criticalDamage)
            val elementalAttack = baseElementalAttack + BASE_ELEMENTAL_FLAT + mergedLane.elementalAttackBonus // base hidden +11 plus gear elemental
            val elementalMultiplier = (1.0 + ((elementalAttack - MONSTER_RESIST) * ELEMENT_COEFF)).coerceAtLeast(0.0)
            val situationalMultiplier = 1.0 + situationalBonus
            val partyMultiplier = 1.0 + partySynergyBonus
            val effectiveDefense = (MONSTER_DEFENSE * (1.0 - mergedLane.defensePenetration)).coerceAtLeast(0.0)
            val defenseMultiplier = calculateDefenseMultiplier(effectiveDefense)

            val baseSkillDamage = baseAttack * skill.coeff
            val totalMultiplier = defenseMultiplier *
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

            // Combine global/item 쿨감 + 스킬 고유 쿨감, 70% 단일 캡 후 쿨회 적용
            val combinedCdr = calculateStackedReduction(listOf(totalCdr, specificCdr)).coerceAtMost(0.7)
            val realCd = (skill.baseCd) *
                (1.0 - combinedCdr).coerceAtLeast(MIN_CD_FACTOR) /
                (1.0 + totalRecovery)

            // Continuous cast model over 40s to reflect 쿨감 효용
            // Fixed to floor() to match Dundam's discrete count
            val castCount = kotlin.math.floor(40.0 / realCd)
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
                    statMultiplier = 1.0,
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

    private fun aggregateLaneTotals(
        status: DnfCharacterFullStatus,
        passiveLane: LaneTotals = LaneTotals()
    ): LaneTotals {
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

        return fromEquipment + creatureLane + passiveLane + status.setLaneTotals
    }

    private fun laneFromOptions(options: ItemFixedOptions): LaneTotals =
        LaneTotals(
            skillAtk = options.skillAtkIncrease,
            damageIncrease = options.damageIncrease,
            additionalDamage = options.additionalDamage,
            finalDamage = options.finalDamage,
            criticalDamage = options.criticalDamage,
            elementalAttackBonus = options.elementalDamage,
            defensePenetration = options.defensePenetration,
            cooldownReduction = options.cooldownReduction,
            cooldownRecovery = options.cooldownRecovery
        )

    private fun aggregatePassiveLanes(styleLevels: List<CharacterSkillLevel>): LaneTotals {
        if (styleLevels.isEmpty()) return LaneTotals()
        val lanes = styleLevels.mapNotNull { style ->
            val entities = skillRepository.findBySkillId(style.skillId)
            val entity = entities.firstOrNull() ?: return@mapNotNull null
            val rows = entity.parseLevelRows(objectMapper)
            val best = rows
                .filter { (it.level ?: 0) <= style.level }
                .maxByOrNull { it.level ?: 0 }
                ?: rows.maxByOrNull { it.level ?: 0 }
            if (best == null) return@mapNotNull null
            parsePassiveLane(entity.optionDesc, best.optionValue)
        }
        return lanes.fold(LaneTotals()) { acc, lane -> acc + lane }
    }

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

    private fun fetchSkillsFromDb(keys: List<String>, styleLevels: List<CharacterSkillLevel>): List<SkillDefinition> {
        keys.forEach { key ->
            val byAdvancement = skillRepository.findByJobGrowNameIgnoreCase(key)
            if (byAdvancement.isNotEmpty()) {
                return byAdvancement.mapNotNull { it.toSkillDefinition(objectMapper, styleLevels) }
                    .sortedByDescending { it.level }
                    .take(20)
            }

            val byJob = skillRepository.findByJobNameIgnoreCase(key)
            if (byJob.isNotEmpty()) {
                return byJob.mapNotNull { it.toSkillDefinition(objectMapper, styleLevels) }
                    .sortedByDescending { it.level }
                    .take(20)
            }
        }
        return emptyList()
    }

    private fun DnfSkillEntity.toSkillDefinition(
        mapper: ObjectMapper,
        styleLevels: List<CharacterSkillLevel>
    ): SkillDefinition? {
        val detail = parseDetail(mapper)
        val rows = parseLevelRows(mapper)
        val targetLevel = resolveStyleLevel(styleLevels)
        val best = rows
            .filter { targetLevel == null || (it.level ?: 0) <= targetLevel }
            .maxByOrNull { it.level ?: 0 }
            ?: rows.maxByOrNull { it.level ?: 0 }

        val coeff = best?.let { row ->
            val fromTemplate = skillCalculationService.calculateTotalDamagePercent(optionDesc, row.optionValue)
            val templateCoeff = if (fromTemplate > 0) {
                skillCalculationService.toSkillCoefficient(fromTemplate)
            } else 0.0

            val metrics = extractOptionMetrics(optionDesc, row.optionValue)
            val numericValues = row.optionValue.values
            
            val damageRaw = when {
                metrics.damageValues.isNotEmpty() -> metrics.damageValues.maxOrNull() ?: 1.0
                numericValues.isNotEmpty() -> numericValues.maxOrNull() ?: 1.0
                else -> 1.0
            }
            val hits = metrics.hitCounts.maxOrNull()?.coerceAtLeast(1.0) ?: 1.0
            val stacks = metrics.stackCounts.maxOrNull()?.coerceAtLeast(1.0) ?: 1.0
            
            // Heuristic: If template missed the hit count (template is approx equal to raw damage),
            // but we found explicit hits, use the multiplied value.
            // Safe fallback: take the maximum of template calculation and component-wise calculation
            val componentCoeff = normalizeCoeff(damageRaw) * hits * stacks
            
            max(templateCoeff, componentCoeff)
        } ?: 1.0
        val enhancementEffect = resolveEnhancementEffect(detail, styleLevels, mapper)

        val cdBase = best?.coolTime ?: this.baseCoolTime ?: DEFAULT_BASE_CD
        val cd = (cdBase * (1.0 - enhancementEffect.cdReduction)).coerceAtLeast(MIN_CD_FACTOR)
        
        // Apply Gaehwa/Enhancement Multipliers (Skill Atk, Final Dmg) directly to coeff
        val finalCoeff = coeff * enhancementEffect.coeffMultiplier

        val level = targetLevel ?: best?.level ?: this.requiredLevel ?: this.maxLevel ?: 0
        return SkillDefinition(
            skillId = this.skillId,
            name = this.skillName,
            skillType = this.skillType,
            level = level,
            coeff = finalCoeff,
            baseCd = cd,
            laneBonus = enhancementEffect.laneBonus
        )
    }

    private fun DnfSkillEntity.resolveStyleLevel(styleLevels: List<CharacterSkillLevel>): Int? {
        if (styleLevels.isEmpty()) return null
        val byId = styleLevels.firstOrNull { it.skillId == this.skillId }?.level
        if (byId != null) return byId
        val normName = normalizeKey(this.skillName)
        return styleLevels.firstOrNull { normalizeKey(it.name) == normName }?.level
    }

    private fun DnfSkillEntity.parseDetail(mapper: ObjectMapper): NormalizedSkillDetail? {
        val json = this.detailJson ?: return null
        return runCatching { mapper.readValue(json, NormalizedSkillDetail::class.java) }
            .getOrNull()
    }

    private fun DnfSkillEntity.parseEnhancementJson(mapper: ObjectMapper): List<NormalizedEnhancement> {
        val json = this.enhancementJson ?: return emptyList()
        return runCatching {
            mapper.readValue(json, object : TypeReference<List<NormalizedEnhancement>>() {})
        }.getOrElse { emptyList() }
    }

    private fun DnfSkillEntity.parseEvolutionJson(mapper: ObjectMapper): List<org.example.dnf_raid.service.NormalizedEvolution> {
        val json = this.evolutionJson ?: return emptyList()
        return runCatching {
            mapper.readValue(json, object : TypeReference<List<org.example.dnf_raid.service.NormalizedEvolution>>() {})
        }.getOrElse { emptyList() }
    }

    private data class EnhancementEffect(
        val laneBonus: LaneTotals = LaneTotals(),
        val cdReduction: Double = 0.0,
        val coeffMultiplier: Double = 1.0
    )

    private fun DnfSkillEntity.resolveEnhancementEffect(
        detail: NormalizedSkillDetail?,
        styleLevels: List<CharacterSkillLevel>,
        mapper: ObjectMapper
    ): EnhancementEffect {
        val enhancements = when {
            detail?.enhancement?.isNotEmpty() == true -> detail.enhancement
            !this.enhancementJson.isNullOrBlank() -> parseEnhancementJson(mapper)
            else -> emptyList()
        }
        val evolutions = when {
            !this.evolutionJson.isNullOrBlank() -> parseEvolutionJson(mapper)
            else -> emptyList()
        }
        
        val style = styleLevels.firstOrNull { it.skillId == this.skillId }
        val enhancementType = style?.enhancementType
        val evolutionType = style?.evolutionType

        var totalSkillAtk = 0.0
        var totalDamageInc = 0.0
        var totalAdditional = 0.0
        var totalFinalDamage = 0.0
        var totalCdReduction = 0.0
        var totalCoeffMultiplier = 1.0

        // Helper to parse structure option list (Enhancement)
        fun applyEnhancement(opts: List<NormalizedEnhancement>?, myType: Int?) {
            if (opts == null || myType == null) return
            val match = opts.firstOrNull { it.type == myType } ?: return
            
            match.status.forEach { status ->
                val name = status.name?.lowercase(Locale.getDefault())?.replace(" ", "") ?: return@forEach
                val valueStr = status.value?.replace("%", "")?.replace("초", "") ?: return@forEach
                val value = valueStr.toDoubleOrNull() ?: return@forEach
                
                when {
                    name.contains("스킬공격력") || name.contains("skillatk") || name.contains("공격력증가") -> totalSkillAtk += value / 100.0
                    name.contains("최종데미지") || name.contains("finaldamage") -> totalFinalDamage += value / 100.0
                    name.contains("쿨타임") || name.contains("cooldown") -> totalCdReduction += value / 100.0
                    name.contains("공격력") && !name.contains("스킬") -> totalSkillAtk += value / 100.0
                    else -> {}
                }
            }
        }
        
        // Helper to parse text based option list (Evolution/Gaehwa)
        fun applyEvolution(opts: List<org.example.dnf_raid.service.NormalizedEvolution>?, myType: Int?) {
            if (opts == null || myType == null) return
            val match = opts.firstOrNull { it.type == myType } ?: return
            
            // Gaehwa uses 'desc' string, e.g. "Attack Power +20%, Cooldown -10%"
            val desc = match.desc ?: return
            
            // Simple regex for comma-separated or newline-separated values
            // Pattern: (Keyword)... (Number)%
            val valuePattern = Regex("""([가-힣a-zA-Z\s]+)[^0-9-]*([-+]?\d+(\.\d+)?)\s*%""")
            
            valuePattern.findAll(desc).forEach { m ->
                val keyword = m.groupValues[1].replace(" ", "").lowercase()
                val value = m.groupValues[2].toDoubleOrNull() ?: 0.0
                
                when {
                    keyword.contains("공격력") || keyword.contains("atk") || keyword.contains("데미지") -> {
                        // Awakening Attack often implies Final Damage multiplier to the skill
                        totalSkillAtk += value / 100.0
                    }
                    keyword.contains("쿨타임") || keyword.contains("cooldown") -> {
                         // Negative value usually means reduction in text? or absolute?
                         // "Cooldown -10%" -> value is -10. reduction += 0.1
                         // "Cooldown Reduction 10%" -> value is 10. reduction += 0.1
                         if (keyword.contains("감소") || keyword.contains("reduction")) {
                             totalCdReduction += value / 100.0
                         } else if (value < 0) {
                             totalCdReduction += -value / 100.0
                         }
                    }
                }
            }
        }

        applyEnhancement(enhancements, enhancementType)
        applyEvolution(evolutions, evolutionType)
        
        // Convert stacked Skill Atk to Coeff Multiplier if it's treated as final
        // Usually Enhancement/Evolution provides a separate multiplier line (Final Dmg or Custom Skill Atk).
        // If it's pure "Skill Atk", it stacks additively within the system but usually multiplicatively with gear.
        // However, for Skill specific options, they are often Multiplicative to the base skill.
        // Let's treat them as Lane Checks first.
        // Actually, Gaehwa "Attack +20%" is usually a direct multiplier to the skill coefficient.
        // So we will put it into coeffMultiplier.
        
        val lane = LaneTotals(
            skillAtk = 0.0, // Don't put it in lane, use coeffMultiplier
            damageIncrease = totalDamageInc,
            additionalDamage = totalAdditional,
            finalDamage = 0.0 // Don't put FinalDmg in lane either, use coeffMultiplier
        )
        
        // Combine Skill Atk and Final Damage into direct coefficient multiplier
        val combinedMulti = (1.0 + totalSkillAtk) * (1.0 + totalFinalDamage)
        totalCoeffMultiplier *= combinedMulti

        return EnhancementEffect(
            laneBonus = lane,
            cdReduction = totalCdReduction.coerceAtMost(0.7),
            coeffMultiplier = totalCoeffMultiplier
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
            raw > 100 -> raw / 100.0
            else -> raw
        }
    }

    private fun parsePassiveLane(optionDesc: String?, optionValue: Map<String, Double>?): LaneTotals {
        if (optionDesc.isNullOrBlank() || optionValue == null) return LaneTotals()
        val regex = Regex("""\{(value\d+)\}""")
        val matches = regex.findAll(optionDesc)
        var skillAtk = 0.0
        var damageIncrease = 0.0
        var additionalDamage = 0.0
        var finalDamage = 0.0
        var criticalDamage = 0.0
        var elemental = 0
        var cooldownReduction = 0.0
        var cooldownRecovery = 0.0

        matches.forEach { match ->
            val key = match.groupValues.getOrNull(1) ?: return@forEach
            val idx = match.range.first
            val windowStart = (idx - 25).coerceAtLeast(0)
            val windowEnd = (idx + 35).coerceAtMost(optionDesc.length)
            val window = optionDesc.substring(windowStart, windowEnd).lowercase(Locale.getDefault())
            val num = optionValue[key] ?: return@forEach

            when {
                PASSIVE_SKILL_ATK_KEYWORDS.any { window.contains(it) } -> skillAtk += num / 100.0
                PASSIVE_DAMAGE_INC_KEYWORDS.any { window.contains(it) } -> damageIncrease += num / 100.0
                PASSIVE_ADDITIONAL_KEYWORDS.any { window.contains(it) } -> additionalDamage += num / 100.0
                PASSIVE_FINAL_KEYWORDS.any { window.contains(it) } -> finalDamage += num / 100.0
                PASSIVE_CRIT_KEYWORDS.any { window.contains(it) } -> criticalDamage += num / 100.0
                PASSIVE_ELEMENTAL_KEYWORDS.any { window.contains(it) } -> elemental += num.toInt()
                PASSIVE_COOLDOWN_REDUCTION_KEYWORDS.any { window.contains(it) } -> cooldownReduction += num / 100.0
                PASSIVE_COOLDOWN_RECOVERY_KEYWORDS.any { window.contains(it) } -> cooldownRecovery += num / 100.0
            }
        }

        return LaneTotals(
            skillAtk = skillAtk,
            damageIncrease = damageIncrease,
            additionalDamage = additionalDamage,
            finalDamage = finalDamage,
            criticalDamage = criticalDamage,
            elementalAttackBonus = elemental,
            cooldownReduction = cooldownReduction,
            cooldownRecovery = cooldownRecovery
        )
    }

    private fun resolveBaseElementalAttack(status: DnfCharacterFullStatus): Int =
        maxOf(
            status.townStats.elementInfo.fire,
            status.townStats.elementInfo.water,
            status.townStats.elementInfo.light,
            status.townStats.elementInfo.shadow
        )

    private fun calculateDefenseMultiplier(defense: Double): Double {
        val multiplier = 1.0 - (defense / (defense + DEF_NORMALIZER))
        return multiplier.coerceIn(0.0, 1.0)
    }

    private fun calculateStackedReduction(values: List<Double>): Double =
        1.0 - values.fold(1.0) { acc, value ->
            acc * (1.0 - value)
        }.coerceAtLeast(0.0)

    private fun resolveSkills(status: DnfCharacterFullStatus): List<SkillDefinition> {
        val keys = candidateKeys(status)
        val styleLevels = status.skillLevels

        val fileSkills = keys.asSequence()
            .mapNotNull { skillsByAdvancement[it] }
            .firstOrNull { it.isNotEmpty() }
        if (fileSkills != null) return fileSkills

        val dbSkills = fetchSkillsFromDb(keys, styleLevels)
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
                val refreshed = fetchSkillsFromDb(keys, styleLevels)
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

        val byId = styleLevels.groupBy { it.skillId }.mapValues { (_, list) ->
            list.maxByOrNull { it.level }
        }
        val byName = styleLevels.mapNotNull { entry ->
            entry.name?.let { normalizeKey(it) to entry }
        }.toMap()

        val filtered = skills.filter { def ->
            val match = def.skillId?.let { byId[it] } ?: byName[normalizeKey(def.name)]
            match != null && match.level > 0
        }

        if (filtered.isEmpty()) {
            logger.warn(
                "Skill style filter removed all skills (styleCount={}, skillCount={}, job={})",
                styleLevels.size,
                skills.size,
                skills.firstOrNull()?.name
            )
        }

        return filtered
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
        val baseCd: Double,
        val laneBonus: LaneTotals = LaneTotals()
    )

    companion object {
        // Max Cooltime Reduction is 70% -> Min Cooltime Factor is 30%
        private const val MIN_CD_FACTOR = 0.3
        private const val ELEMENT_COEFF = 0.0045 // Midheaven season elemental efficiency
        private const val BASE_ELEMENTAL_FLAT = 11
        private const val BASE_ELEMENTAL_RESIST = 100
        private const val CRIT_BASE = 1.5
        // Training room sandbag (Dundam 기준): 방어력/속저 거의 0으로 간주
        private const val MONSTER_DEFENSE = 0.0
        private const val DEF_NORMALIZER = 1.0  // 최소값 보호
        private const val MONSTER_RESIST = 0
        private const val STAT_BASELINE = 2_500.0
        private const val STAT_NORMALIZER = 2_500.0
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
        private val HIT_KEYWORDS = listOf("타격", "히트", "타수", "hit", "횟수")
        private val STACK_KEYWORDS = listOf("스택", "stack", "중첩")
        private val PASSIVE_SKILL_ATK_KEYWORDS = listOf("스킬공격력", "skill atk", "skill attack")
        private val PASSIVE_DAMAGE_INC_KEYWORDS = listOf("데미지 증가", "피해 증가", "damage increase", "dmg increase")
        private val PASSIVE_ADDITIONAL_KEYWORDS = listOf("추가 데미지", "추가피해", "additional damage")
        private val PASSIVE_FINAL_KEYWORDS = listOf("최종 데미지", "final damage")
        private val PASSIVE_CRIT_KEYWORDS = listOf("치명타", "크리티컬", "critical damage", "crit damage")
        private val PASSIVE_ELEMENTAL_KEYWORDS = listOf("속성 강화", "elemental damage", "elemental atk", "elemental attack")
        private val PASSIVE_COOLDOWN_REDUCTION_KEYWORDS = listOf("쿨타임 감소", "재사용 대기시간 감소", "cooldown reduction", "cooltime reduction")
        private val PASSIVE_COOLDOWN_RECOVERY_KEYWORDS = listOf("쿨타임 회복", "쿨타임 회복속도", "cooldown recovery")
    }
}
