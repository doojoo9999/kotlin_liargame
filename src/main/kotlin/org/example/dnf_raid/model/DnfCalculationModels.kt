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
    val creature: DnfCreature?
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
    val itemGrade: String
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
