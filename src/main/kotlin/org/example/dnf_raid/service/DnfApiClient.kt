package org.example.dnf_raid.service

import org.example.dnf_raid.config.DnfApiProperties
import org.example.dnf_raid.model.AvatarSlot
import org.example.dnf_raid.model.BasicInfo
import org.example.dnf_raid.model.DnfAvatar
import org.example.dnf_raid.model.DnfCharacterFullStatus
import org.example.dnf_raid.model.DnfCreature
import org.example.dnf_raid.model.DnfEquipItem
import org.example.dnf_raid.model.DnfNumberParser
import org.example.dnf_raid.model.Element
import org.example.dnf_raid.model.ItemFixedOptions
import org.example.dnf_raid.model.JobRole
import org.example.dnf_raid.model.SlotType
import org.example.dnf_raid.model.TownStats
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.server.ResponseStatusException
import java.util.Locale
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ConcurrentHashMap

@Component
class DnfApiClient(
    private val restClient: RestClient,
    private val properties: DnfApiProperties
    ) {

    private val logger = LoggerFactory.getLogger(DnfApiClient::class.java)
    private val itemFixedOptionCache = ConcurrentHashMap<String, ItemFixedOptions>()

    fun searchCharacters(
        serverId: String,
        characterName: String,
        limit: Int = 20,
        wordType: String = "full"
    ): List<DnfCharacterApiResponse> {
        val apiKey = properties.apiKey ?: throw IllegalStateException("DNF API 키(DNF_API_KEY)가 설정되지 않았습니다.")
        return try {
            val response = restClient.get()
                .uri { builder ->
                    builder
                        .path("/servers/{serverId}/characters")
                        .queryParam("characterName", characterName)
                        .queryParam("limit", limit)
                        .queryParam("wordType", wordType)
                        .queryParam("apikey", apiKey)
                        .build(serverId)
                }
                .retrieve()
                .body(DnfCharacterSearchResponse::class.java)

            response?.rows ?: emptyList()
        } catch (ex: Exception) {
            logger.error("DNF 캐릭터 검색 실패: {}", ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "DNF 캐릭터 검색에 실패했습니다.")
        }
    }

    fun fetchCharacter(serverId: String, characterId: String): DnfCharacterApiResponse? {
        val apiKey = properties.apiKey ?: throw IllegalStateException("DNF API 키(DNF_API_KEY)가 설정되지 않았습니다.")
        return try {
            restClient.get()
                .uri { builder ->
                    builder
                        .path("/servers/{serverId}/characters/{characterId}")
                        .queryParam("apikey", apiKey)
                        .build(serverId, characterId)
                }
                .retrieve()
                .body(DnfCharacterApiResponse::class.java)
        } catch (ex: Exception) {
            logger.error("DNF 캐릭터 조회 실패 (serverId={}, characterId={}): {}", serverId, characterId, ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "캐릭터 정보를 불러오지 못했습니다.")
        }
    }

    /**
     * 캐릭터 전체 상태(마을 스탯, 장비, 아바타, 크리쳐)를 병렬로 조회 후 도메인 모델로 변환한다.
     * 장비의 성장 옵션(피증/버프력) + 커스텀 옵션을 합산하며, 아이템 상세 고정 옵션은 캐시한다.
     */
    fun fetchFullCharacterStatus(serverId: String, characterId: String): DnfCharacterFullStatus {
        val apiKey = properties.apiKey ?: throw IllegalStateException("DNF API 키(DNF_API_KEY)가 설정되지 않았습니다.")
        val normalizedServerId = serverId.trim().lowercase(Locale.getDefault())

        val statusFuture = CompletableFuture.supplyAsync {
            fetchCharacterStatusInternal(normalizedServerId, characterId, apiKey)
        }
        val equipFuture = CompletableFuture.supplyAsync {
            fetchEquipmentInternal(normalizedServerId, characterId, apiKey)
        }
        val avatarFuture = CompletableFuture.supplyAsync {
            fetchAvatarInternal(normalizedServerId, characterId, apiKey)
        }
        val creatureFuture = CompletableFuture.supplyAsync {
            fetchCreatureInternal(normalizedServerId, characterId, apiKey)
        }

        val status = statusFuture.join()
        val equipment = equipFuture.join()
        val avatar = avatarFuture.join()
        val creature = creatureFuture.join()

        val role = inferRole(status.jobGrowName ?: status.jobName)

        val avatarBuffPower = avatar.sumOf { extractBuffPower(it.optionSummary) }
        val avatarDamage = avatar.sumOf { extractDamageValue(it.optionSummary) }
        val totalBuffPower = equipment.sumOf { it.growthBuffPower } + avatarBuffPower + (creature?.buffPower ?: 0)
        val totalDamageValue = equipment.sumOf { it.growthDamageValue } + avatarDamage + (creature?.damageBonus ?: 0)

        if (logger.isDebugEnabled) {
            logger.debug(
                "Aggregated throughput role={} buffPower={} damage={} (characterId={})",
                role, totalBuffPower, totalDamageValue, characterId
            )
        }

        val townStats = status.townStats.copy(
            buffScore = status.townStats.buffScore ?: if (role == JobRole.BUFFER) totalBuffPower else status.townStats.buffScore
        )

        return DnfCharacterFullStatus(
            basicInfo = BasicInfo(
                id = status.characterId ?: characterId,
                name = status.characterName.orEmpty(),
                jobName = status.jobName.orEmpty(),
                advancement = status.jobGrowName.orEmpty(),
                role = role
            ),
            townStats = townStats,
            equipment = equipment,
            avatar = avatar,
            creature = creature
        )
    }

    fun buildCharacterImageUrl(serverId: String, characterId: String, zoom: Int = 2): String =
        "${properties.imageBaseUrl}/servers/$serverId/characters/$characterId?zoom=$zoom"

    private fun fetchCharacterStatusInternal(serverId: String, characterId: String, apiKey: String): CharacterStatusAggregate {
        return try {
            val response = restClient.get()
                .uri { builder ->
                    builder
                        .path("/servers/{serverId}/characters/{characterId}/status")
                        .queryParam("apikey", apiKey)
                        .build(serverId, characterId)
                }
                .retrieve()
                .body(CharacterStatusResponse::class.java)

            val townStats = response?.toTownStats() ?: TownStats()
            CharacterStatusAggregate(
                characterId = response?.characterId ?: characterId,
                characterName = response?.characterName,
                jobName = response?.jobName,
                jobGrowName = response?.jobGrowName,
                townStats = townStats
            )
        } catch (ex: Exception) {
            logger.error("DNF 캐릭터 상태 조회 실패 (serverId={}, characterId={}): {}", serverId, characterId, ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "캐릭터 상태 정보를 불러오지 못했습니다.")
        }
    }

    private fun fetchEquipmentInternal(serverId: String, characterId: String, apiKey: String): List<DnfEquipItem> {
        return try {
            val response = restClient.get()
                .uri { builder ->
                    builder
                        .path("/servers/{serverId}/characters/{characterId}/equip/equipment")
                        .queryParam("apikey", apiKey)
                        .build(serverId, characterId)
                }
                .retrieve()
                .body(EquipmentResponse::class.java)

            response?.equipment.orEmpty().mapNotNull { slot ->
                val slotType = mapSlotType(slot.slotId) ?: return@mapNotNull null

                val damageFromExplain = extractDamageValue(slot.explain)
                val buffFromExplain = extractBuffPower(slot.explain)
                val damageFromCustom = slot.customOption?.damage?.toLong() ?: 0L
                val buffFromCustom = slot.customOption?.buff?.toLong() ?: 0L

                val fixedOptions = fetchItemFixedOptions(slot.itemId, apiKey)

                DnfEquipItem(
                    slot = slotType,
                    itemId = slot.itemId,
                    growthDamageValue = damageFromExplain + damageFromCustom,
                    growthBuffPower = buffFromExplain + buffFromCustom,
                    fixedOptions = fixedOptions
                )
            }
        } catch (ex: Exception) {
            logger.error("DNF 장비 조회 실패 (serverId={}, characterId={}): {}", serverId, characterId, ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "장비 정보를 불러오지 못했습니다.")
        }
    }

    private fun fetchAvatarInternal(serverId: String, characterId: String, apiKey: String): List<DnfAvatar> {
        return try {
            val response = restClient.get()
                .uri { builder ->
                    builder
                        .path("/servers/{serverId}/characters/{characterId}/equip/avatar")
                        .queryParam("apikey", apiKey)
                        .build(serverId, characterId)
                }
                .retrieve()
                .body(AvatarResponse::class.java)

            response?.avatar.orEmpty().mapNotNull { avatar ->
                val slot = mapAvatarSlot(avatar.slotId) ?: return@mapNotNull null
                DnfAvatar(slot = slot, optionSummary = avatar.optionAbility.orEmpty())
            }
        } catch (ex: Exception) {
            logger.error("DNF 아바타 조회 실패 (serverId={}, characterId={}): {}", serverId, characterId, ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "아바타 정보를 불러오지 못했습니다.")
        }
    }

    private fun fetchCreatureInternal(serverId: String, characterId: String, apiKey: String): DnfCreature? {
        return try {
            val response = restClient.get()
                .uri { builder ->
                    builder
                        .path("/servers/{serverId}/characters/{characterId}/equip/creature")
                        .queryParam("apikey", apiKey)
                        .build(serverId, characterId)
                }
                .retrieve()
                .body(CreatureResponse::class.java)

            val creature = response?.creature ?: return null
            val buffPower = extractBuffPower(creature.explain)
            val damageBonus = extractDamageValue(creature.explain)
            val element = parseElement(creature.explain)

            DnfCreature(
                name = creature.itemName.orEmpty(),
                itemId = creature.itemId,
                buffPower = buffPower,
                damageBonus = damageBonus,
                element = element
            )
        } catch (ex: Exception) {
            logger.error("DNF 크리쳐 조회 실패 (serverId={}, characterId={}): {}", serverId, characterId, ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "크리쳐 정보를 불러오지 못했습니다.")
        }
    }

    private fun fetchItemFixedOptions(itemId: String, apiKey: String): ItemFixedOptions {
        return itemFixedOptionCache[itemId] ?: run {
            val fetched = try {
                val response = restClient.get()
                    .uri { builder ->
                        builder
                            .path("/items/{itemId}")
                            .queryParam("apikey", apiKey)
                            .build(itemId)
                    }
                    .retrieve()
                    .body(ItemDetailResponse::class.java)

                parseFixedOptions(response?.itemFixedOption?.explain.orEmpty())
            } catch (ex: Exception) {
                logger.warn("아이템 고정 옵션 조회 실패 (itemId={}): {}", itemId, ex.message)
                ItemFixedOptions(rawDescription = "")
            }
            itemFixedOptionCache[itemId] = fetched
            fetched
        }
    }

    private fun CharacterStatusResponse.toTownStats(): TownStats {
        fun pick(vararg keys: String): Long {
            val lowerKeys = keys.map { it.lowercase(Locale.getDefault()) }
            val match = status.firstOrNull { entry ->
                val name = entry.name?.lowercase(Locale.getDefault()) ?: return@firstOrNull false
                lowerKeys.any { key -> name.contains(key) }
            }
            return match?.value?.toLong() ?: 0L
        }

        val buffValue = status.firstOrNull { it.name?.contains("버프", ignoreCase = true) == true }?.value?.toLong()

        return TownStats(
            strength = pick("힘"),
            intelligence = pick("지능"),
            vitality = pick("체력", "vitality"),
            spirit = pick("정신", "정신력", "spirit"),
            physicalAttack = pick("물리공", "물리 공격", "물리공격"),
            magicalAttack = pick("마법공", "마법 공격", "마법공격"),
            independentAttack = pick("독립공", "독립 공격", "독립공격"),
            buffScore = buffValue
        )
    }

    private fun parseFixedOptions(explain: String): ItemFixedOptions {
        val skillAtkRatio = SKILL_ATK_PATTERN.find(explain)?.groupValues?.getOrNull(2)?.toDoubleOrNull()?.div(100) ?: 0.0
        val elemental = ELEMENTAL_DAMAGE_PATTERN.find(explain)?.groupValues?.getOrNull(2)?.toIntOrNull() ?: 0
        val cooldown = COOLTIME_REDUCTION_PATTERN.find(explain)?.groupValues?.getOrNull(2)?.toDoubleOrNull()?.div(100) ?: 0.0
        val buffPower = BUFF_POWER_PATTERN.find(explain)?.groupValues?.getOrNull(2)?.replace(",", "")?.toLongOrNull() ?: 0L

        return ItemFixedOptions(
            skillAtkInc = skillAtkRatio,
            buffPowerStep = buffPower,
            cooldownReduction = cooldown,
            elementalDamage = elemental,
            rawDescription = explain
        )
    }

    private fun extractDamageValue(text: String?): Long {
        val match = DAMAGE_PATTERN.find(text.orEmpty()) ?: return 0L
        return DnfNumberParser.parseLongValue(match.groupValues.getOrNull(1))
    }

    private fun extractBuffPower(text: String?): Long {
        val match = BUFF_PATTERN.find(text.orEmpty()) ?: return 0L
        return DnfNumberParser.parseLongValue(match.groupValues.getOrNull(1))
    }

    private fun parseElement(text: String?): Element? {
        val lower = text?.lowercase(Locale.getDefault()) ?: return null
        return when {
            lower.contains("화속") || lower.contains("불") || lower.contains("fire") -> Element.FIRE
            lower.contains("수속") || lower.contains("물") || lower.contains("water") -> Element.WATER
            lower.contains("명속") || lower.contains("빛") || lower.contains("light") -> Element.LIGHT
            lower.contains("암속") || lower.contains("어둠") || lower.contains("shadow") -> Element.SHADOW
            else -> null
        }
    }

    private fun mapSlotType(slotId: String): SlotType? {
        val normalized = slotId.uppercase(Locale.getDefault()).replace("-", "_")
        return when (normalized) {
            "SUBEQUIPMENT" -> SlotType.SUB_EQUIPMENT
            "SUB_EQUIPMENT" -> SlotType.SUB_EQUIPMENT
            "MAGICSTONE" -> SlotType.MAGIC_STONE
            "MAGIC_STONE" -> SlotType.MAGIC_STONE
            else -> SlotType.values().firstOrNull { it.name == normalized }
        }
    }

    private fun mapAvatarSlot(slotId: String): AvatarSlot? {
        val normalized = slotId.uppercase(Locale.getDefault()).replace("-", "_")
        return when (normalized) {
            "HEADGEAR", "HAT" -> AvatarSlot.HAT
            "HAIR" -> AvatarSlot.HAIR
            "FACE" -> AvatarSlot.FACE
            "JACKET", "CHEST", "TOP" -> AvatarSlot.CHEST
            "PANTS", "BOTTOM" -> AvatarSlot.PANTS
            "SHOES" -> AvatarSlot.SHOES
            "SKIN" -> AvatarSlot.SKIN
            "AURA" -> AvatarSlot.AURA
            else -> AvatarSlot.values().firstOrNull { it.name == normalized }
        }
    }

    private fun inferRole(jobGrowName: String?): JobRole {
        val lower = jobGrowName?.lowercase(Locale.getDefault()) ?: return JobRole.DEALER
        return if (
            lower.contains("크루세이더") ||
            lower.contains("세인트") ||
            lower.contains("세라핌") ||
            lower.contains("헤카테") ||
            lower.contains("버퍼")
        ) {
            JobRole.BUFFER
        } else {
            JobRole.DEALER
        }
    }

    companion object {
        private val DAMAGE_PATTERN = Regex("""피해\\s*증가\\s*([\\d,]+)""", RegexOption.IGNORE_CASE)
        private val BUFF_PATTERN = Regex("""버프력\\s*([\\d,]+)""", RegexOption.IGNORE_CASE)
        private val SKILL_ATK_PATTERN = Regex("""(스킬\\s*공격력|스증)\\s*(\\d+)\\s*%""", setOf(RegexOption.IGNORE_CASE, RegexOption.MULTILINE))
        private val ELEMENTAL_DAMAGE_PATTERN = Regex("""(모든\\s*속성\\s*강화|모속강)\\s*\\+?(\\d+)""", setOf(RegexOption.IGNORE_CASE, RegexOption.MULTILINE))
        private val COOLTIME_REDUCTION_PATTERN = Regex("""(쿨타임\\s*감소|쿨감)\\s*(\\d+)\\s*%""", setOf(RegexOption.IGNORE_CASE, RegexOption.MULTILINE))
        private val BUFF_POWER_PATTERN = Regex("""버프력\\s*([\\d,]+)""", setOf(RegexOption.IGNORE_CASE, RegexOption.MULTILINE))
    }
}

data class DnfCharacterSearchResponse(
    val rows: List<DnfCharacterApiResponse> = emptyList()
)

data class DnfCharacterApiResponse(
    val serverId: String,
    val characterId: String,
    val characterName: String,
    val jobName: String,
    val jobGrowName: String,
    val fame: Int = 0,
    val adventureName: String? = null
)

data class CharacterStatusAggregate(
    val characterId: String?,
    val characterName: String?,
    val jobName: String?,
    val jobGrowName: String?,
    val townStats: TownStats
)

data class CharacterStatusResponse(
    val characterId: String? = null,
    val characterName: String? = null,
    val jobName: String? = null,
    val jobGrowName: String? = null,
    val status: List<StatusEntry> = emptyList()
)

data class StatusEntry(
    val name: String? = null,
    val value: Double? = null
)

data class EquipmentResponse(
    val equipment: List<EquipmentSlot> = emptyList()
)

data class EquipmentSlot(
    val slotId: String,
    val itemId: String,
    val explain: String? = null,
    val customOption: EquipmentCustomOption? = null
)

data class EquipmentCustomOption(
    val buff: Long? = null,
    val damage: Long? = null
)

data class AvatarResponse(
    val avatar: List<AvatarItem> = emptyList()
)

data class AvatarItem(
    val slotId: String,
    val optionAbility: String? = null
)

data class CreatureResponse(
    val creature: CreatureItem? = null
)

data class CreatureItem(
    val itemId: String? = null,
    val itemName: String? = null,
    val explain: String? = null
)

data class ItemDetailResponse(
    val itemFixedOption: ItemFixedOptionExplain? = null
)

data class ItemFixedOptionExplain(
    val explain: String? = null
)
