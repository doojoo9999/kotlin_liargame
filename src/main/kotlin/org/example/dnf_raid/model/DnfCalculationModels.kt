package org.example.dnf_raid.model

data class DnfCharacterFullStatus(
    val serverId: String,
    val characterId: String,
    val jobId: String? = null,
    val jobGrowId: String? = null,
    val jobName: String,
    val advancementName: String,
    val level: Int,
    val townStats: TownStats,
    val equipment: List<DnfEquipItem>,
    val avatars: List<DnfAvatar>,
    val creature: DnfCreature?,
    val skillLevels: List<CharacterSkillLevel> = emptyList(),
    val talismans: List<DnfTalisman> = emptyList(),
    val setLaneTotals: LaneTotals = LaneTotals()
)

data class CharacterSkillLevel(
    val skillId: String,
    val name: String? = null,
    val level: Int,
    val enhancementType: Int? = null,
    val evolutionType: Int? = null
)

data class TownStats(
    val strength: Long,
    val intelligence: Long,
    val vitality: Long,
    val spirit: Long,
    val physicalAttack: Long,
    val magicalAttack: Long,
    val independentAttack: Long,
    val elementInfo: ElementInfo
)

data class ElementInfo(
    val fire: Int,
    val water: Int,
    val light: Int,
    val shadow: Int
)

data class DnfEquipItem(
    val slotName: String,
    val itemId: String,
    val itemName: String,
    val buffPower: Long,
    val fixedOptions: ItemFixedOptions,
    val statusBonus: ItemStatusTotals = ItemStatusTotals(),
    val setPoint: Int,
    val itemGrade: String,
    val setItemId: String? = null,
    val reinforce: Int = 0,
    val amplificationName: String? = null
)

data class ItemFixedOptions(
    val skillAtkIncrease: Double,
    val attackIncrease: Double = 0.0,
    val damageIncrease: Double = 0.0,
    val additionalDamage: Double = 0.0,
    val finalDamage: Double = 0.0,
    val criticalDamage: Double = 0.0,
    val cooldownReduction: Double,
    val cooldownRecovery: Double,
    val elementalDamage: Int,
    val defensePenetration: Double = 0.0,
    val levelOptions: Map<Int, LevelOption>
)

data class LevelOption(
    val skillAtkInc: Double,
    val attackIncrease: Double = 0.0,
    val cdr: Double,
    val cooldownRecovery: Double = 0.0,
    val damageIncrease: Double = 0.0,
    val additionalDamage: Double = 0.0,
    val finalDamage: Double = 0.0,
    val criticalDamage: Double = 0.0
)

data class ItemStatusTotals(
    val strength: Long = 0,
    val intelligence: Long = 0,
    val vitality: Long = 0,
    val spirit: Long = 0,
    val physicalAttack: Long = 0,
    val magicalAttack: Long = 0,
    val independentAttack: Long = 0,
    val fireElement: Int = 0,
    val waterElement: Int = 0,
    val lightElement: Int = 0,
    val shadowElement: Int = 0,
    val allElement: Int = 0
) {
    fun isEmpty(): Boolean =
        strength == 0L &&
            intelligence == 0L &&
            vitality == 0L &&
            spirit == 0L &&
            physicalAttack == 0L &&
            magicalAttack == 0L &&
            independentAttack == 0L &&
            fireElement == 0 &&
            waterElement == 0 &&
            lightElement == 0 &&
            shadowElement == 0 &&
            allElement == 0

    operator fun plus(other: ItemStatusTotals): ItemStatusTotals = ItemStatusTotals(
        strength = strength + other.strength,
        intelligence = intelligence + other.intelligence,
        vitality = vitality + other.vitality,
        spirit = spirit + other.spirit,
        physicalAttack = physicalAttack + other.physicalAttack,
        magicalAttack = magicalAttack + other.magicalAttack,
        independentAttack = independentAttack + other.independentAttack,
        fireElement = fireElement + other.fireElement,
        waterElement = waterElement + other.waterElement,
        lightElement = lightElement + other.lightElement,
        shadowElement = shadowElement + other.shadowElement,
        allElement = allElement + other.allElement
    )
}

data class DnfAvatar(
    val slotName: String,
    val emblems: List<String>,
    val buffPower: Long = 0
)

data class DnfCreature(
    val name: String,
    val artifactStats: List<String>,
    val buffPower: Long = 0,
    val damageBonus: Long = 0
)

data class DnfTalisman(
    val slotName: String,
    val itemId: String,
    val itemName: String,
    val skillName: String? = null,
    val runeTypes: List<String> = emptyList()
)

data class LaneTotals(
    val skillAtk: Double = 0.0,
    val attackIncrease: Double = 0.0,
    val damageIncrease: Double = 0.0,
    val additionalDamage: Double = 0.0,
    val finalDamage: Double = 0.0,
    val criticalDamage: Double = 0.0,
    val elementalAttackBonus: Int = 0,
    val defensePenetration: Double = 0.0,
    val cooldownReduction: Double = 0.0,
    val cooldownRecovery: Double = 0.0
) {
    operator fun plus(other: LaneTotals): LaneTotals = LaneTotals(
        // Skill Atk is multiplicative: (1+a)*(1+b) - 1
        skillAtk = (1.0 + skillAtk) * (1.0 + other.skillAtk) - 1.0,
        // Attack Increase is additive sum
        attackIncrease = attackIncrease + other.attackIncrease,
        damageIncrease = damageIncrease + other.damageIncrease,
        additionalDamage = additionalDamage + other.additionalDamage,
        // Final Damage (Season 10) is Multiplicative (like Skill Atk)
        finalDamage = (1.0 + finalDamage) * (1.0 + other.finalDamage) - 1.0,
        
        criticalDamage = criticalDamage + other.criticalDamage,
        elementalAttackBonus = elementalAttackBonus + other.elementalAttackBonus,
        defensePenetration = defensePenetration + other.defensePenetration,
        // CDR is multiplicative reduction: 1 - (1-a)*(1-b)
        cooldownReduction = 1.0 - (1.0 - cooldownReduction) * (1.0 - other.cooldownReduction),
        cooldownRecovery = cooldownRecovery + other.cooldownRecovery
    )
}
