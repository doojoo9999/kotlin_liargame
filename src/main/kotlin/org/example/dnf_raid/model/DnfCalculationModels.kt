package org.example.dnf_raid.model

enum class JobRole {
    DEALER,
    BUFFER
}

enum class StatType {
    STR,
    INT,
    PHYS_ATK,
    MAG_ATK,
    INDEP_ATK
}

enum class Element {
    FIRE,
    WATER,
    LIGHT,
    SHADOW
}

enum class SlotType {
    WEAPON,
    TOP,
    SHOULDER,
    BOTTOM,
    BELT,
    SHOES,
    NECKLACE,
    BRACELET,
    RING,
    SUB_EQUIPMENT,
    MAGIC_STONE,
    EARRING,
    TITLE,
    AURA,
    PET
}

enum class AvatarSlot {
    HAT,
    HAIR,
    FACE,
    CHEST,
    PANTS,
    SHOES,
    SKIN,
    AURA
}

data class DnfCharacterFullStatus(
    val basicInfo: BasicInfo,
    val townStats: TownStats,
    val equipment: List<DnfEquipItem> = emptyList(),
    val avatar: List<DnfAvatar> = emptyList(),
    val creature: DnfCreature? = null
)

data class BasicInfo(
    val id: String,
    val name: String,
    val jobName: String,
    val advancement: String,
    val role: JobRole
)

data class TownStats(
    val strength: Long = 0,
    val intelligence: Long = 0,
    val vitality: Long = 0,
    val spirit: Long = 0,
    val physicalAttack: Long = 0,
    val magicalAttack: Long = 0,
    val independentAttack: Long = 0,
    val buffScore: Long? = null
) {
    fun asMap(): Map<StatType, Long> = mapOf(
        StatType.STR to strength,
        StatType.INT to intelligence,
        StatType.PHYS_ATK to physicalAttack,
        StatType.MAG_ATK to magicalAttack,
        StatType.INDEP_ATK to independentAttack
    )
}

data class DnfEquipItem(
    val slot: SlotType,
    val itemId: String,
    val growthDamageValue: Long = 0,
    val growthBuffPower: Long = 0,
    val fixedOptions: ItemFixedOptions = ItemFixedOptions()
)

data class ItemFixedOptions(
    val skillAtkInc: Double = 0.0,
    val buffPowerStep: Long = 0,
    val cooldownReduction: Double = 0.0,
    val elementalDamage: Int = 0,
    val rawDescription: String = ""
)

data class DnfAvatar(
    val slot: AvatarSlot,
    val optionSummary: String = ""
)

data class DnfCreature(
    val name: String,
    val itemId: String? = null,
    val buffPower: Long = 0,
    val damageBonus: Long = 0,
    val element: Element? = null
)

object DnfNumberParser {
    private val percentPattern = Regex("""(-?\\d+(?:\\.\\d+)?)\\s*%""")
    private val numberPattern = Regex("""(-?\\d[\\d,]*(?:\\.\\d+)?)""")

    /**
     * Extracts the first percentage value and converts it to a ratio.
     * Example: "스킬 공격력 12% 증가" -> 0.12
     */
    fun parsePercentToRatio(text: String?): Double {
        val percentString = percentPattern.find(text.orEmpty())?.groupValues?.getOrNull(1)
        return percentString?.replace(",", "")?.toDoubleOrNull()?.div(100) ?: 0.0
    }

    /**
     * Extracts the first numeric value (commas allowed) as a Long.
     */
    fun parseLongValue(text: String?): Long {
        val numberString = numberPattern.find(text.orEmpty())?.groupValues?.getOrNull(1)
        return numberString?.replace(",", "")?.toDoubleOrNull()?.toLong() ?: 0L
    }
}
