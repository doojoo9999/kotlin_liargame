package org.example.dnf_raid.service

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import org.example.dnf_raid.model.DnfCharacterFullStatus
import org.example.dnf_raid.model.BuffStats
import org.example.dnf_raid.model.ItemFixedOptions
import org.example.dnf_raid.model.ItemStatusTotals
import org.example.dnf_raid.model.LevelOption
import org.example.dnf_raid.model.CharacterSkillLevel
import org.example.dnf_raid.model.DnfSkillEntity
import org.example.dnf_raid.model.DnfEquipItem
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
    private val apiClient: DnfApiClient,
    private val skillRepository: DnfSkillRepository,
    private val skillCatalogService: DnfSkillCatalogService,
    private val skillCalculationService: SkillCalculationService
) {

    private val logger = LoggerFactory.getLogger(DnfPowerCalculator::class.java)
    private val skillsByAdvancement: Map<String, List<SkillDefinition>> by lazy { loadSkillDb() }
    private val syncLock = ConcurrentHashMap.newKeySet<String>()

    /**
        Dealer combat power = sum of all skill scores in 43s window.
        Score(skill) = SingleDamage * CastCount
        Based on docs/dnf/damage_formula_2025.md lanes.
     */
    fun calculateDealerScore(
        status: DnfCharacterFullStatus,
        monsterResist: Int = 0,
        situationalBonus: Double = DEFAULT_SITUATIONAL_BONUS,
        partySynergyBonus: Double = DEFAULT_PARTY_SYNERGY_BONUS,
        dungeonType: DungeonType = DungeonType.SANDBAG,
        buffStats: BuffStats? = null
    ): DealerCalculationResult {
        val skills = resolveSkills(status)
        if (skills.isEmpty()) {
            logger.warn("No skills found for advancement={}", status.advancementName)
            return DealerCalculationResult(totalScore = 0.0, topSkills = emptyList())
        }
        val filteredSkills = applySkillFilters(skills, status.skillLevels)
        val usableSkills = filteredSkills.ifEmpty { skills }

        val equipmentStatus = aggregateItemStatusTotals(status.equipment)
        val baseAttack = maxOf(
            status.townStats.physicalAttack + equipmentStatus.physicalAttack,
            status.townStats.magicalAttack + equipmentStatus.magicalAttack,
            status.townStats.independentAttack + equipmentStatus.independentAttack
        ).toDouble()
        val totalStrength = (status.townStats.strength + equipmentStatus.strength).toDouble()
        val totalIntelligence = (status.townStats.intelligence + equipmentStatus.intelligence).toDouble()

        val passiveLane = aggregatePassiveLanes(status.skillLevels)
        val laneTotals = aggregateLaneTotals(status, passiveLane)
        val baseElementalAttack = resolveBaseElementalAttack(status, equipmentStatus)

        val totalCdr = calculateStackedReduction(
            status.equipment.map { it.fixedOptions.cooldownReduction } + passiveLane.cooldownReduction
        )

        val buffMultiplier = resolveBuffMultiplier(buffStats)

        val skillScores = usableSkills.map { skill ->
            val levelOptions = status.equipment.mapNotNull { it.fixedOptions.levelOptions[skill.level] }
            val levelLanes = aggregateLevelLanes(levelOptions)
            val mergedLane = laneTotals + levelLanes + skill.laneBonus

            val attackIncreaseMultiplier = 1.0 + mergedLane.attackIncrease
            val skillAtkMultiplier = 1.0 + mergedLane.skillAtk
            val damageIncreaseMultiplier =
                (1.0 + mergedLane.damageIncrease) * (1.0 + mergedLane.additionalDamage)
            val finalDamageMultiplier = 1.0 + mergedLane.finalDamage
            // Main Stat Step: (1 + MainStat / 250)
            val mainStat = resolveMainStat(status, totalStrength, totalIntelligence)
            val statMultiplier = 1.0 + (mainStat / 250.0)

            // Elem Step: 1.05 + 0.0045 * Elem
            val elementalAttack = baseElementalAttack + mergedLane.elementalAttackBonus
            val elementalMultiplier = 1.05 + (elementalAttack * ELEMENT_COEFF)

            // IncPart Steps
            // M_atkInc (Add)
            val mAtkInc = (1.0 + mergedLane.attackIncrease)
            // M_dmgInc (Product) - Damage Increase * Additional Damage
            val mDmgInc = damageIncreaseMultiplier
            // M_skillInc (Product) - Skill Atk + Final Damage (treated as Skill Atk)
            val mSkillInc = (1.0 + mergedLane.skillAtk) * (1.0 + mergedLane.finalDamage)
            // M_etc (Product) - Critical, Counter(Situation), Party
            val mEtc = (CRIT_BASE * (1.0 + mergedLane.criticalDamage)) *
                    (1.0 + situationalBonus) *
                    (1.0 + partySynergyBonus)
            
            val defenseMultiplier = calculateDefenseMultiplier(
                defense = dungeonType.baseDefense,
                attackerLevel = status.level,
                defensePenetration = mergedLane.defensePenetration
            )

            val totalMultiplier = mAtkInc * mDmgInc * mSkillInc * mEtc * 
                                  statMultiplier * elementalMultiplier * defenseMultiplier
            
            // Skill Coefficient is already computed as "NormalizedCoeff = Percent / 100.0"
            // So: BaseAtk * Coeff * Multipliers
            val singleDamageBase = calculateSingleDamageWithoutBuff(baseAttack, skill.coeff, totalMultiplier)
            val singleDamage = calculateSingleDamageWithBuff(singleDamageBase, buffMultiplier)

            val specificCdr = calculateStackedReduction(levelOptions.map { it.cdr })

            // Combine global/item 쿨감 + 스킬 고유 쿨감, 70% 단일 캡 후 쿨회 적용
            val combinedCdr = calculateStackedReduction(listOf(totalCdr, specificCdr)).coerceAtMost(0.7)
            val totalRecovery = mergedLane.cooldownRecovery.coerceAtLeast(0.0)
            val realCd = (skill.baseCd) *
                (1.0 - combinedCdr).coerceAtLeast(MIN_CD_FACTOR) /
                (1.0 + totalRecovery)

            val castCount = simulateCastCount(realCd, skill.castingTime, SKILL_TIME_WINDOW_SECONDS)
            val score = singleDamage * castCount
            val totalMultiplierWithBuff = totalMultiplier * buffMultiplier

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
                    baseSkillDamage = baseAttack * skill.coeff,
                    statMultiplier = statMultiplier,
                    defenseMultiplier = defenseMultiplier,
                    attackIncreaseMultiplier = mAtkInc,
                    skillAtkMultiplier = mSkillInc,
                    damageIncreaseMultiplier = mDmgInc,
                    finalDamageMultiplier = 1.0, // Merged into mSkillInc
                    criticalMultiplier = (CRIT_BASE * (1.0 + mergedLane.criticalDamage)),
                    elementalMultiplier = elementalMultiplier,
                    situationalMultiplier = (1.0 + situationalBonus),
                    partyMultiplier = (1.0 + partySynergyBonus),
                    totalMultiplier = totalMultiplierWithBuff,
                    totalDamage = singleDamage
                )
            )
        }.sortedByDescending { it.score }

        val totalScore = skillScores.sumOf { it.score }

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
            topSkills = skillScores
        )
    }

    fun calculateSingleDamageWithoutBuff(
        baseAttack: Double,
        skillCoeff: Double,
        totalMultiplier: Double
    ): Double = (baseAttack * skillCoeff) * totalMultiplier

    fun calculateSingleDamageWithBuff(baseDamage: Double, buffStats: BuffStats?): Double {
        return calculateSingleDamageWithBuff(baseDamage, resolveBuffMultiplier(buffStats))
    }

    private fun calculateSingleDamageWithBuff(baseDamage: Double, buffMultiplier: Double): Double =
        baseDamage * buffMultiplier

    private fun resolveBuffMultiplier(buffStats: BuffStats?): Double {
        if (buffStats == null) return 1.0
        val buffScore = calcDundamBuffScore(buffStats)
        return buffMultiplierFromBuffScore(buffScore)
    }

    /**
     * Buffer score (Dundam-style reference dealer model).
     * Returns 0 for non-buffer classes.
     */
    fun calculateBufferScore(status: DnfCharacterFullStatus): Long {
        if (!isBufferClass(status)) return 0L
        val equipmentStatus = aggregateItemStatusTotals(status.equipment)
        val bufferStat = resolveBufferStat(status, equipmentStatus).toDouble()
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

    private fun aggregateItemStatusTotals(equipment: List<DnfEquipItem>): ItemStatusTotals =
        equipment.fold(ItemStatusTotals()) { acc, item -> acc + item.statusBonus }

    private fun laneFromOptions(options: ItemFixedOptions): LaneTotals =
        LaneTotals(
            skillAtk = options.skillAtkIncrease,
            attackIncrease = options.attackIncrease,
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
                attackIncrease = opt.attackIncrease,
                damageIncrease = opt.damageIncrease,
                additionalDamage = opt.additionalDamage,
                finalDamage = opt.finalDamage,
                criticalDamage = opt.criticalDamage,
                cooldownRecovery = opt.cooldownRecovery
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

            val numericValues = row.optionValue.values
            
            // Fix for Hogeokban/Multi-component skills:
            // Instead of taking Max(Damage) * Max(Hits), we sum (Damage_i * Hit_i).
            val measuredCoeff = calculateComponentDamageSum(optionDesc, row.optionValue)
            
            // Fallback if parsing failed completely but we have raw values
            val damageRaw = if (measuredCoeff > 0) measuredCoeff else {
                val maxDmg = numericValues.maxOrNull() ?: 1.0
                val maxHits = numericValues.find { it < 100 && it > 1 } ?: 1.0 // naive heuristic
                normalizeCoeff(maxDmg) * maxHits
            }
            
            max(templateCoeff, if (measuredCoeff > 0) measuredCoeff else damageRaw)
        } ?: 1.0
        val enhancementEffect = resolveEnhancementEffect(detail, styleLevels, mapper)

        val cdBase = best?.coolTime ?: this.baseCoolTime ?: DEFAULT_BASE_CD
        val castTime = ((best?.castingTime ?: 0.0) * (1.0 - enhancementEffect.castingTimeReduction)).coerceAtLeast(0.0)
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
            castingTime = castTime,
            laneBonus = enhancementEffect.laneBonus
        )
    }

    private fun DnfSkillEntity.parseLevelRows(mapper: ObjectMapper): List<NormalizedLevelRow> {
        // Try the most specific serialized form first
        fun decodeRows(raw: String?): List<NormalizedLevelRow> {
            if (raw.isNullOrBlank()) return emptyList()
            runCatching {
                mapper.readValue(raw, object : TypeReference<List<NormalizedLevelRow>>() {})
            }.getOrNull()?.takeIf { it.isNotEmpty() }?.let { return it }

            runCatching {
                mapper.readValue(raw, NormalizedLevelInfo::class.java)
            }.getOrNull()?.rows?.takeIf { it.isNotEmpty() }?.let { return it }

            runCatching {
                mapper.readValue(raw, NormalizedSkillDetail::class.java)
            }.getOrNull()?.levelInfo?.rows?.takeIf { it.isNotEmpty() }?.let { return it }

            return emptyList()
        }

        // Stored JSON variants: levelRowsJson (preferred), levelInfoJson, detailJson
        val fromRows = decodeRows(levelRowsJson)
        if (fromRows.isNotEmpty()) return fromRows

        val fromLevelInfo = decodeRows(levelInfoJson)
        if (fromLevelInfo.isNotEmpty()) return fromLevelInfo

        return decodeRows(detailJson)
    }

    private fun DnfSkillEntity.parseDetail(mapper: ObjectMapper): NormalizedSkillDetail? {
        detailJson?.takeIf { it.isNotBlank() }?.let { raw ->
            runCatching { mapper.readValue(raw, NormalizedSkillDetail::class.java) }
                .getOrNull()
                ?.let { return it }
        }

        val levelInfo = runCatching {
            levelInfoJson?.takeIf { it.isNotBlank() }
                ?.let { mapper.readValue(it, NormalizedLevelInfo::class.java) }
        }.getOrNull()

        val enhancement = runCatching {
            enhancementJson?.takeIf { it.isNotBlank() }
                ?.let { mapper.readValue(it, object : TypeReference<List<NormalizedEnhancement>>() {}) }
        }.getOrNull().orEmpty()

        val evolution = runCatching {
            evolutionJson?.takeIf { it.isNotBlank() }
                ?.let { mapper.readValue(it, object : TypeReference<List<NormalizedEvolution>>() {}) }
        }.getOrNull().orEmpty()

        val rows = parseLevelRows(mapper)
        val fallbackLevelInfo = levelInfo ?: NormalizedLevelInfo(
            optionDesc = optionDesc,
            rows = rows
        )

        return NormalizedSkillDetail(
            name = skillName,
            type = skillType,
            desc = skillDesc,
            descDetail = skillDescDetail,
            descSpecial = emptyList(),
            consumeItem = null,
            maxLevel = maxLevel,
            requiredLevel = requiredLevel,
            requiredLevelRange = null,
            jobId = jobId,
            jobName = jobName,
            levelInfo = fallbackLevelInfo,
            evolution = evolution,
            enhancement = enhancement
        )
    }

    private fun DnfSkillEntity.resolveStyleLevel(styleLevels: List<CharacterSkillLevel>): Int? {
        if (styleLevels.isEmpty()) return null
        val byId = styleLevels.firstOrNull { it.skillId == this.skillId }
        if (byId != null) return byId.level

        val normalizedName = normalizeKey(this.skillName)
        return styleLevels.firstOrNull { normalizeKey(it.name) == normalizedName }?.level
    }

    private fun DnfSkillEntity.resolveEnhancementEffect(
        detail: NormalizedSkillDetail?,
        styleLevels: List<CharacterSkillLevel>,
        mapper: ObjectMapper
    ): EnhancementEffect {
        val normalizedDetail = detail ?: parseDetail(mapper) ?: return EnhancementEffect()
        return resolveEnhancementEffect(normalizedDetail, styleLevels, this.skillId, this.skillName)
    }

    private fun resolveEnhancementEffect(
        detail: NormalizedSkillDetail,
        styleLevels: List<CharacterSkillLevel>,
        skillId: String?,
        skillName: String?
    ): EnhancementEffect {
        val style = styleLevels.firstOrNull { it.skillId == skillId }
            ?: styleLevels.firstOrNull { normalizeKey(it.name) == normalizeKey(skillName) }
        val preferredEnhancement = style?.enhancementType

        val enhancementStatuses = detail.enhancement
            .filter { preferredEnhancement == null || it.type == null || it.type == preferredEnhancement }
            .flatMap { it.status }

        // Currently NormalizedEvolution doesn't expose status-like entries, so we only use enhancement list.
        val laneBonus = enhancementStatuses.fold(LaneTotals()) { acc, status ->
            acc + parseStatusToLane(status)
        }

        var coeffMultiplier = 1.0
        var cdReduction = 0.0
        var castingTimeReduction = 0.0
        enhancementStatuses.forEach { status ->
            val value = parseStatusValue(status.value)
            val name = status.name?.lowercase(Locale.getDefault()) ?: return@forEach
            when {
                name.contains("쿨") || name.contains("cool") -> cdReduction = max(cdReduction, value)
                name.contains("시전") || name.contains("casting") -> castingTimeReduction = max(castingTimeReduction, value)
                name.contains("스킬공격력") || name.contains("skill atk") -> coeffMultiplier *= (1.0 + value)
                name.contains("최종") || name.contains("final") -> coeffMultiplier *= (1.0 + value)
                name.contains("피해") || name.contains("데미지") || name.contains("damage") -> coeffMultiplier *= (1.0 + value)
            }
        }

        return EnhancementEffect(
            laneBonus = laneBonus,
            coeffMultiplier = coeffMultiplier,
            cdReduction = cdReduction,
            castingTimeReduction = castingTimeReduction
        )
    }

    private fun parseStatusValue(raw: String?): Double {
        if (raw.isNullOrBlank()) return 0.0
        val cleaned = raw.replace("%", "").replace(",", "").trim()
        return cleaned.toDoubleOrNull()?.div(100.0) ?: 0.0
    }

    private fun parseStatusToLane(status: NormalizedStatus?): LaneTotals {
        status ?: return LaneTotals()
        val value = parseStatusValue(status.value)
        val name = status.name?.lowercase(Locale.getDefault()) ?: return LaneTotals()

        return when {
            name.contains("스킬공격력") || name.contains("skill atk") -> LaneTotals(skillAtk = value)
            name.contains("공격력 증가") || name.contains("attack increase") -> LaneTotals(attackIncrease = value)
            name.contains("추가") && (name.contains("피해") || name.contains("데미지")) -> LaneTotals(additionalDamage = value)
            name.contains("피해 증가") || name.contains("데미지 증가") || name.contains("damage increase") -> LaneTotals(damageIncrease = value)
            name.contains("최종") || name.contains("final damage") -> LaneTotals(finalDamage = value)
            name.contains("치명") || name.contains("크리") || name.contains("critical") -> LaneTotals(criticalDamage = value)
            name.contains("쿨") && name.contains("회복") -> LaneTotals(cooldownRecovery = value)
            name.contains("쿨") -> LaneTotals(cooldownReduction = value)
            else -> LaneTotals()
        }
    }

    private data class EnhancementEffect(
        val laneBonus: LaneTotals = LaneTotals(),
        val coeffMultiplier: Double = 1.0,
        val cdReduction: Double = 0.0,
        val castingTimeReduction: Double = 0.0
    )

    private fun calculateComponentDamageSum(optionDesc: String?, optionValue: Map<String, Double>?): Double {
        if (optionDesc.isNullOrBlank() || optionValue == null) return 0.0
        
        // Split by lines or logical separators to isolate components
        // e.g. "Loop Dmg: {v1}%, Loop Hits: {v2}"
        // "Finish Dmg: {v3}%"
        
        // 1. Identify pairs of (Damage, Hits) by proximity.
        // We scan the text. When we find a Damage keyword, we look for a Hit keyword nearby (until next Damage keyword).
        
        val variableRegex = Regex("""\{(value\d+)\}""")
        
        // Map values to text positions
        val tokenMap = mutableListOf<Token>()
        variableRegex.findAll(optionDesc).forEach { match ->
             val key = match.groupValues[1]
             val value = optionValue[key] ?: return@forEach
             tokenMap.add(Token(key, value, match.range.first, match.range.last))
        }
        
        if (tokenMap.isEmpty()) return 0.0
        
        // Classify tokens
        val classified = tokenMap.map { token ->
            val context = getContext(optionDesc, token.start)
            val type = determineType(context)
            ClassifiedToken(token, type)
        }
        
        var totalPercent = 0.0
        
        // Grouping Strategy:
        // Iterate through tokens.
        // If we find a Damage token, we look ahead for Hit tokens before the NEXT Damage token.
        // If multiple Hit tokens found, usually they adhere to the Damage.
        // If None found, Hits = 1.
        
        var currentDamage: Double? = null
        var currentHits = 1.0
        var currentStacks = 1.0
        
        for (i in classified.indices) {
            val curr = classified[i]
            
            if (curr.type == TokenType.DAMAGE) {
                // Determine if we should flush previous
                if (currentDamage != null) {
                    totalPercent += normalizeCoeff(currentDamage) * currentHits * currentStacks
                }
                // Reset for new component
                currentDamage = curr.token.value
                currentHits = 1.0
                currentStacks = 1.0
            } else if (curr.type == TokenType.HIT_COUNT) {
                 // Update hits for current component
                 // If no current damage, discard or wait? 
                 // Usually Hit Count follows Damage in text.
                 if (currentDamage != null) {
                     currentHits = max(currentHits, curr.token.value) // If multiple hit counts appear, maybe pick max or product? Usually just one.
                 }
            } else if (curr.type == TokenType.STACK_COUNT) {
                 if (currentDamage != null) {
                     currentStacks = max(currentStacks, curr.token.value)
                 }
            }
        }
        
        // Flush last
        if (currentDamage != null) {
            totalPercent += normalizeCoeff(currentDamage) * currentHits * currentStacks
        }
        
        return totalPercent
    }
    
    private enum class TokenType { DAMAGE, HIT_COUNT, STACK_COUNT, UNKNOWN }
    private data class Token(val key: String, val value: Double, val start: Int, val end: Int)
    private data class ClassifiedToken(val token: Token, val type: TokenType)

    private fun getContext(text: String, pos: Int): String {
        val start = (pos - 20).coerceAtLeast(0)
        val end = (pos + 30).coerceAtMost(text.length)
        return text.substring(start, end).lowercase(Locale.getDefault())
    }

    private fun determineType(context: String): TokenType {
        return when {
            HIT_KEYWORDS.any { context.contains(it) } -> TokenType.HIT_COUNT
            STACK_KEYWORDS.any { context.contains(it) } -> TokenType.STACK_COUNT
            DAMAGE_KEYWORDS.any { context.contains(it) } -> TokenType.DAMAGE
            else -> TokenType.DAMAGE // Default to damage if unknown but numeric? Dangerous. Better UNKNOWN or safe fallback.
            // Actually many "Attack Power" strings just say "Atttack Power {v}".
            // So if it's not explicitly hits/stacks, treat as damage IF it looks large? 
            // Or rely on keywords.
        }
    }

    // Reuse or redefine extracted keywords helpers if needed, but we deleted `extractOptionMetrics` usage.
    // So we can remove `extractOptionMetrics` or keep it deprecated.
    
    private fun normalizeCoeff(raw: Double): Double {
        // Assume all 'Attack Power' values in optionValues are in Percent (e.g. 2345.0 = 2345%)
        // If a value is 50.0, it means 50%, so 0.5.
        // We act indiscriminately to solve "Too High" damage issues where small percents were treated as flat multipliers.
        return raw / 100.0
    }



    private fun parsePassiveLane(optionDesc: String?, optionValue: Map<String, Double>?): LaneTotals {
        if (optionDesc.isNullOrBlank() || optionValue == null) return LaneTotals()
        val regex = Regex("""\{(value\d+)\}""")
        val matches = regex.findAll(optionDesc)
        var skillAtk = 0.0
        var attackIncrease = 0.0
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
                PASSIVE_ATTACK_INCREASE_KEYWORDS.any { window.contains(it) } -> attackIncrease += num / 100.0
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
            attackIncrease = attackIncrease,
            damageIncrease = damageIncrease,
            additionalDamage = additionalDamage,
            finalDamage = finalDamage,
            criticalDamage = criticalDamage,
            elementalAttackBonus = elemental,
            cooldownReduction = cooldownReduction,
            cooldownRecovery = cooldownRecovery
        )
    }

    private fun resolveBaseElementalAttack(status: DnfCharacterFullStatus, equipmentStatus: ItemStatusTotals): Int {
        val allElement = equipmentStatus.allElement
        val fire = status.townStats.elementInfo.fire + equipmentStatus.fireElement + allElement
        val water = status.townStats.elementInfo.water + equipmentStatus.waterElement + allElement
        val light = status.townStats.elementInfo.light + equipmentStatus.lightElement + allElement
        val shadow = status.townStats.elementInfo.shadow + equipmentStatus.shadowElement + allElement
        return maxOf(fire, water, light, shadow)
    }

    private fun resolveMainStat(
        status: DnfCharacterFullStatus,
        strength: Double,
        intelligence: Double
    ): Double {
        val key = "${status.jobName} ${status.advancementName}".lowercase(Locale.getDefault())
        return when {
            MAGICAL_MAIN_STAT_KEYWORDS.any { key.contains(it) } -> intelligence
            PHYSICAL_MAIN_STAT_KEYWORDS.any { key.contains(it) } -> strength
            else -> max(strength, intelligence)
        }
    }

    private fun calculateDefenseMultiplier(
        defense: Double,
        attackerLevel: Int,
        defensePenetration: Double
    ): Double {
        if (defense <= 0.0) return 1.0
        val normalizedLevel = attackerLevel.coerceAtLeast(1)
        val defenseRate = defense / (defense + DEFENSE_LEVEL_COEFF * normalizedLevel)
        val penetration = defensePenetration.coerceIn(0.0, 1.0)
        val effectiveDefenseRate = (defenseRate * (1.0 - penetration)).coerceIn(0.0, 1.0)
        return (1.0 - effectiveDefenseRate).coerceIn(0.0, 1.0)
    }

    private fun simulateCastCount(realCd: Double, castingTime: Double, windowSeconds: Double): Double {
        if (realCd <= 0.0 || windowSeconds <= 0.0) return 0.0
        val castTime = castingTime.coerceAtLeast(0.0)
        if (castTime >= windowSeconds) return 0.0
        val effectiveCooldown = realCd + castTime
        val availableWindow = windowSeconds - castTime
        return kotlin.math.floor(availableWindow / effectiveCooldown) + 1.0
    }

    private fun calculateStackedReduction(values: List<Double>): Double =
        1.0 - values.fold(1.0) { acc, value ->
            acc * (1.0 - value)
        }.coerceAtLeast(0.0)

    private fun fetchSkillsRealTime(status: DnfCharacterFullStatus): List<SkillDefinition> {
        val jobId = status.jobId?.takeIf { it.isNotBlank() } ?: return emptyList()
        val styleLevels = status.skillLevels
        if (styleLevels.isEmpty()) return emptyList()

        val bestBySkillId = styleLevels
            .groupBy { it.skillId }
            .mapNotNull { (_, levels) -> levels.maxByOrNull { it.level } }

        val definitions = mutableListOf<SkillDefinition>()
        bestBySkillId.forEach { style ->
            val detail = apiClient.fetchSkillDetail(jobId, style.skillId) ?: return@forEach
            val normalized = detail.toNormalized()
            val definition = buildSkillDefinitionFromDetail(normalized, style, styleLevels)
            if (definition != null) {
                definitions += definition
            }
        }

        return definitions
    }

    private fun buildSkillDefinitionFromDetail(
        detail: NormalizedSkillDetail,
        style: CharacterSkillLevel,
        styleLevels: List<CharacterSkillLevel>
    ): SkillDefinition? {
        val levelInfo = detail.levelInfo ?: return null
        val rows = levelInfo.rows
        if (rows.isEmpty()) return null

        val targetLevel = style.level
        val best = rows
            .filter { (it.level ?: 0) <= targetLevel }
            .maxByOrNull { it.level ?: 0 }
            ?: rows.maxByOrNull { it.level ?: 0 }

        val optionDesc = levelInfo.optionDesc
        val optionValue = best?.optionValue.orEmpty()

        val fromTemplate = if (!optionDesc.isNullOrBlank() && optionValue.isNotEmpty()) {
            skillCalculationService.calculateTotalDamagePercent(optionDesc, optionValue)
        } else 0.0
        val templateCoeff = if (fromTemplate > 0) {
            skillCalculationService.toSkillCoefficient(fromTemplate)
        } else 0.0

        val measuredCoeff = calculateComponentDamageSum(optionDesc, optionValue)
        val numericValues = optionValue.values
        val fallbackCoeff = if (numericValues.isNotEmpty()) {
            val maxDmg = numericValues.maxOrNull() ?: 1.0
            val maxHits = numericValues.find { it < 100 && it > 1 } ?: 1.0
            normalizeCoeff(maxDmg) * maxHits
        } else 1.0

        val coeff = max(templateCoeff, max(measuredCoeff, fallbackCoeff))
        val enhancementEffect = resolveEnhancementEffect(detail, styleLevels, style.skillId, detail.name ?: style.name)

        val cdBase = best?.coolTime ?: levelInfo.rows.firstOrNull()?.coolTime ?: DEFAULT_BASE_CD
        val castTimeBase = best?.castingTime ?: levelInfo.rows.firstOrNull()?.castingTime ?: 0.0
        val castTime = (castTimeBase * (1.0 - enhancementEffect.castingTimeReduction)).coerceAtLeast(0.0)
        val cd = (cdBase * (1.0 - enhancementEffect.cdReduction)).coerceAtLeast(MIN_CD_FACTOR)
        val finalCoeff = coeff * enhancementEffect.coeffMultiplier

        val level = targetLevel.takeIf { it > 0 }
            ?: best?.level
            ?: detail.requiredLevel
            ?: detail.maxLevel
            ?: 0

        return SkillDefinition(
            skillId = style.skillId,
            name = detail.name ?: style.name ?: style.skillId,
            skillType = detail.type,
            level = level,
            coeff = finalCoeff,
            baseCd = cd,
            castingTime = castTime,
            laneBonus = enhancementEffect.laneBonus
        )
    }

    private fun resolveSkills(status: DnfCharacterFullStatus): List<SkillDefinition> {
        val keys = candidateKeys(status)
        val styleLevels = status.skillLevels

        val realTimeSkills = fetchSkillsRealTime(status)
        if (realTimeSkills.isNotEmpty()) {
            logger.info("Loaded skills from real-time API for jobId={}", status.jobId)
            return realTimeSkills
        }

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

    private fun resolveBufferStat(status: DnfCharacterFullStatus, equipmentStatus: ItemStatusTotals): Long =
        listOf(
            status.townStats.intelligence + equipmentStatus.intelligence,
            status.townStats.vitality + equipmentStatus.vitality,
            status.townStats.spirit + equipmentStatus.spirit
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

    enum class DungeonType(val baseDefense: Double) {
        NORMAL(25000.0),
        ANCIENT(150000.0),
        RAID_OZMA(200000.0),
        SANDBAG(0.0)
    }

    data class DamageBreakdown(
        val baseSkillDamage: Double,
        val statMultiplier: Double,
        val defenseMultiplier: Double,
        val attackIncreaseMultiplier: Double,
        val skillAtkMultiplier: Double,
        val damageIncreaseMultiplier: Double,
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
        val castingTime: Double = 0.0,
        val laneBonus: LaneTotals = LaneTotals()
    )

    companion object {
        // Max Cooltime Reduction is 70% -> Min Cooltime Factor is 30%
        private const val MIN_CD_FACTOR = 0.3
        private const val ELEMENT_COEFF = 0.0045 // Midheaven season elemental efficiency
        // private const val BASE_ELEMENTAL_FLAT = 11 // Deprecated in User Formula
        private const val BASE_ELEMENTAL_RESIST = 100
        private const val CRIT_BASE = 1.5
        private const val DEFENSE_LEVEL_COEFF = 200.0
        private const val SKILL_TIME_WINDOW_SECONDS = 43.0
        private const val MONSTER_RESIST = 0
        private const val STAT_BASELINE = 2_500.0
        private const val STAT_NORMALIZER = 2_500.0
        private const val DEFAULT_SITUATIONAL_BONUS = 0.0
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
        private val MAGICAL_MAIN_STAT_KEYWORDS = listOf(
            "마법사",
            "메이지",
            "소울브링어",
            "아수라",
            "소환사",
            "엘레멘탈",
            "마도학자",
            "빙결사",
            "배틀메이지",
            "크리에이터",
            "인챈트리스",
            "세라핌",
            "암제"
        )
        private val PHYSICAL_MAIN_STAT_KEYWORDS = listOf(
            "스트라이커",
            "웨펀마스터",
            "버서커",
            "검신",
            "레인저",
            "그래플러",
            "인파이터"
        )
        private val PASSIVE_SKILL_ATK_KEYWORDS = listOf("스킬공격력", "skill atk", "skill attack")
        private val PASSIVE_ATTACK_INCREASE_KEYWORDS = listOf("공격력 증가", "attack increase", "phy atk", "mag atk", "indep atk", "물리 공격력 증가", "마법 공격력 증가", "독립 공격력 증가")
        private val PASSIVE_DAMAGE_INC_KEYWORDS = listOf("데미지 증가", "피해 증가", "damage increase", "dmg increase")
        private val PASSIVE_ADDITIONAL_KEYWORDS = listOf("추가 데미지", "추가피해", "additional damage")
        private val PASSIVE_FINAL_KEYWORDS = listOf("최종 데미지", "final damage")
        private val PASSIVE_CRIT_KEYWORDS = listOf("치명타", "크리티컬", "critical damage", "crit damage")
        private val PASSIVE_ELEMENTAL_KEYWORDS = listOf("속성 강화", "elemental damage", "elemental atk", "elemental attack")
        private val PASSIVE_COOLDOWN_REDUCTION_KEYWORDS = listOf("쿨타임 감소", "재사용 대기시간 감소", "cooldown reduction", "cooltime reduction")
        private val PASSIVE_COOLDOWN_RECOVERY_KEYWORDS = listOf("쿨타임 회복", "쿨타임 회복속도", "cooldown recovery")
    }
}
