package org.example.dnf_raid.model

data class DnfCharacterFullStatus(
    val serverId: String,
    val characterId: String,
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
    val setPoint: Int,
    val itemGrade: String,
    val setItemId: String? = null,
    val reinforce: Int = 0,
    val amplificationName: String? = null
)

data class ItemFixedOptions(
    val skillAtkIncrease: Double,
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
    val cdr: Double,
    val damageIncrease: Double = 0.0,
    val additionalDamage: Double = 0.0,
    val finalDamage: Double = 0.0,
    val criticalDamage: Double = 0.0
)

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
        skillAtk = skillAtk + other.skillAtk,
        damageIncrease = damageIncrease + other.damageIncrease,
        additionalDamage = additionalDamage + other.additionalDamage,
        finalDamage = finalDamage + other.finalDamage,
        criticalDamage = criticalDamage + other.criticalDamage,
        elementalAttackBonus = elementalAttackBonus + other.elementalAttackBonus,
        defensePenetration = defensePenetration + other.defensePenetration,
        cooldownReduction = cooldownReduction + other.cooldownReduction,
        cooldownRecovery = cooldownRecovery + other.cooldownRecovery
    )
}
