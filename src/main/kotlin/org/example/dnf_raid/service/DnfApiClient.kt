package org.example.dnf_raid.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.example.dnf_raid.config.DnfApiProperties
import org.example.dnf_raid.model.DnfAvatar
import org.example.dnf_raid.model.DnfCharacterFullStatus
import org.example.dnf_raid.model.DnfCreature
import org.example.dnf_raid.model.DnfEquipItem
import org.example.dnf_raid.model.ElementInfo
import org.example.dnf_raid.model.ItemFixedOptions
import org.example.dnf_raid.model.LevelOption
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
    private val properties: DnfApiProperties,
    private val objectMapper: ObjectMapper
) {

    private val logger = LoggerFactory.getLogger(DnfApiClient::class.java)
    private val itemFixedOptionCache = ConcurrentHashMap<String, ItemFixedOptions>()

    /**
     * Aggregates Status, Equipment, Avatar, Creature, and Item Detail endpoints into a single snapshot.
     * Item Detail responses are cached by itemId to avoid redundant network calls.
     */
    fun fetchCharacterFullStatus(serverId: String, characterId: String): DnfCharacterFullStatus {
        val normalizedServerId = serverId.trim().lowercase(Locale.getDefault())

        val statusFuture = CompletableFuture.supplyAsync { fetchStatus(normalizedServerId, characterId) }
        val equipmentFuture = CompletableFuture.supplyAsync { fetchEquipment(normalizedServerId, characterId) }
        val avatarFuture = CompletableFuture.supplyAsync { fetchAvatar(normalizedServerId, characterId) }
        val creatureFuture = CompletableFuture.supplyAsync { fetchCreature(normalizedServerId, characterId) }

        val status = statusFuture.join()
        val equipment = equipmentFuture.join()
        val avatars = avatarFuture.join()
            val creature = creatureFuture.join()

        val missingItemIds = equipment.map { it.itemId }.toSet().filterNot { itemFixedOptionCache.containsKey(it) }
        if (missingItemIds.isNotEmpty()) {
            fetchAndCacheItemDetails(missingItemIds)
        }

        val equippedItems = equipment.map { slot ->
            val fixed = itemFixedOptionCache[slot.itemId]
                ?: ItemFixedOptions(
                    skillAtkIncrease = 0.0,
                    damageIncrease = 0.0,
                    additionalDamage = 0.0,
                    finalDamage = 0.0,
                    criticalDamage = 0.0,
                    cooldownReduction = 0.0,
                    cooldownRecovery = 0.0,
                    elementalDamage = 0,
                    defensePenetration = 0.0,
                    levelOptions = emptyMap()
                )
            DnfEquipItem(
                slotName = slot.slotName,
                itemId = slot.itemId,
                itemName = slot.itemName,
                buffPower = slot.buffPower,
                fixedOptions = fixed,
                setPoint = slot.setPoint,
                itemGrade = slot.itemGrade
            )
        }

        return DnfCharacterFullStatus(
            serverId = status.serverId,
            characterId = status.characterId,
            jobName = status.jobName,
            advancementName = status.advancementName,
            level = status.level,
            townStats = status.townStats,
            equipment = equippedItems,
            avatars = avatars,
            creature = creature
        )
    }

    /**
     * Raw loadout snapshot used for DB persistence (timeline + equipment + buff gear).
     */
    fun fetchCharacterLoadoutRaw(
        serverId: String,
        characterId: String,
        timelineLimit: Int = 20
    ): CharacterLoadoutBundle {
        val normalizedServerId = serverId.trim().lowercase(Locale.getDefault())
        val safeLimit = timelineLimit.coerceIn(1, 100)

        val timelineFuture = CompletableFuture.supplyAsync {
            fetchCharacterNode(normalizedServerId, characterId, "timeline", mapOf("limit" to safeLimit))
        }
        val statusFuture = CompletableFuture.supplyAsync {
            fetchCharacterNode(normalizedServerId, characterId, "status")
        }
        val equipmentFuture = CompletableFuture.supplyAsync {
            fetchCharacterNode(normalizedServerId, characterId, "equip/equipment")
        }
        val avatarFuture = CompletableFuture.supplyAsync {
            fetchCharacterNode(normalizedServerId, characterId, "equip/avatar")
        }
        val creatureFuture = CompletableFuture.supplyAsync {
            fetchCharacterNode(normalizedServerId, characterId, "equip/creature")
        }
        val flagFuture = CompletableFuture.supplyAsync {
            fetchCharacterNode(normalizedServerId, characterId, "equip/flag")
        }
        val mistFuture = CompletableFuture.supplyAsync {
            fetchCharacterNode(normalizedServerId, characterId, "equip/mist-assimilation")
        }
        val skillStyleFuture = CompletableFuture.supplyAsync {
            fetchCharacterNode(normalizedServerId, characterId, "skill/style")
        }
        val buffEquipmentFuture = CompletableFuture.supplyAsync {
            fetchCharacterNode(normalizedServerId, characterId, "skill/buff/equip/equipment")
        }
        val buffAvatarFuture = CompletableFuture.supplyAsync {
            fetchCharacterNode(normalizedServerId, characterId, "skill/buff/equip/avatar")
        }
        val buffCreatureFuture = CompletableFuture.supplyAsync {
            fetchCharacterNode(normalizedServerId, characterId, "skill/buff/equip/creature")
        }

        return CharacterLoadoutBundle(
            serverId = normalizedServerId,
            characterId = characterId,
            timeline = timelineFuture.join(),
            status = statusFuture.join(),
            equipment = equipmentFuture.join(),
            avatar = avatarFuture.join(),
            creature = creatureFuture.join(),
            flag = flagFuture.join(),
            mistAssimilation = mistFuture.join(),
            skillStyle = skillStyleFuture.join(),
            buffEquipment = buffEquipmentFuture.join(),
            buffAvatar = buffAvatarFuture.join(),
            buffCreature = buffCreatureFuture.join()
        )
    }

    fun searchCharacters(
        serverId: String,
        characterName: String,
        limit: Int = 20,
        wordType: String = "full"
    ): List<DnfCharacterApiResponse> {
        val apiKey = apiKey()
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

    private fun parseJobGrow(node: JsonNode?): JobGrowRow? {
        node ?: return null
        val jobGrowId = node.get("jobGrowId")?.asText() ?: return null
        val jobGrowName = node.get("jobGrowName")?.asText() ?: ""
        val next = parseJobGrow(node.get("next"))
        return JobGrowRow(jobGrowId = jobGrowId, jobGrowName = jobGrowName, next = next)
    }

    fun fetchCharacter(serverId: String, characterId: String): DnfCharacterApiResponse? {
        val apiKey = apiKey()
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

    fun buildCharacterImageUrl(serverId: String, characterId: String, zoom: Int = 2): String =
        "${properties.imageBaseUrl}/servers/$serverId/characters/$characterId?zoom=$zoom"

    fun fetchJobs(): List<JobRow> {
        val apiKey = apiKey()
        return try {
            val root = restClient.get()
                .uri { builder ->
                    builder
                        .path("/jobs")
                        .queryParam("apikey", apiKey)
                        .build()
                }
                .retrieve()
                .body(JsonNode::class.java)

            val rowsNode = root?.get("rows") ?: return emptyList()
            rowsNode.mapNotNull { jobNode ->
                val jobId = jobNode.get("jobId")?.asText() ?: return@mapNotNull null
                val jobName = jobNode.get("jobName")?.asText() ?: ""
                val growList = jobNode.get("rows")?.mapNotNull { growNode -> parseJobGrow(growNode) } ?: emptyList()
                JobRow(jobId = jobId, jobName = jobName, rows = growList)
            }
        } catch (ex: Exception) {
            logger.error("DNF 직업 목록 조회 실패: {}", ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "직업 목록을 불러오지 못했습니다.")
        }
    }

    fun fetchSkills(jobId: String, jobGrowId: String): List<SkillSummary> {
        val apiKey = apiKey()
        return try {
            val response = restClient.get()
                .uri { builder ->
                    builder
                        .path("/skills/{jobId}")
                        .queryParam("jobGrowId", jobGrowId)
                        .queryParam("apikey", apiKey)
                        .build(jobId)
                }
                .retrieve()
                .body(SkillListResponse::class.java)

            response?.resolved() ?: emptyList()
        } catch (ex: Exception) {
            logger.error("DNF 스킬 목록 조회 실패 (jobId={}, jobGrowId={}): {}", jobId, jobGrowId, ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "스킬 목록을 불러오지 못했습니다.")
        }
    }

    fun fetchSkillDetail(jobId: String, skillId: String): SkillDetailResponse? {
        val apiKey = apiKey()
        return try {
            restClient.get()
                .uri { builder ->
                    builder
                        .path("/skills/{jobId}/{skillId}")
                        .queryParam("apikey", apiKey)
                        .build(jobId, skillId)
                }
                .retrieve()
                .body(SkillDetailResponse::class.java)
        } catch (ex: Exception) {
            logger.error("DNF 스킬 상세 조회 실패 (jobId={}, skillId={}): {}", jobId, skillId, ex.message, ex)
            null
        }
    }

    private fun fetchCharacterNode(
        serverId: String,
        characterId: String,
        subPath: String,
        queryParams: Map<String, Any?> = emptyMap()
    ): JsonNode? {
        val apiKey = apiKey()
        return try {
            restClient.get()
                .uri { builder ->
                    builder
                        .path("/servers/{serverId}/characters/{characterId}/$subPath")
                        .apply {
                            queryParams
                                .filterValues { it != null }
                                .forEach { (key, value) -> queryParam(key, value) }
                        }
                        .queryParam("apikey", apiKey)
                        .build(serverId, characterId)
                }
                .retrieve()
                .body(JsonNode::class.java)
        } catch (ex: Exception) {
            logger.error(
                "DNF 캐릭터 세부 정보 조회 실패 (subPath={}, serverId={}, characterId={}): {}",
                subPath,
                serverId,
                characterId,
                ex.message,
                ex
            )
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "캐릭터 정보를 불러오지 못했습니다. ($subPath)")
        }
    }

    private fun fetchStatus(serverId: String, characterId: String): StatusAggregate {
        val apiKey = apiKey()
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

            StatusAggregate(
                serverId = response?.serverId ?: serverId,
                characterId = response?.characterId ?: characterId,
                jobName = response?.jobName.orEmpty(),
                advancementName = response?.jobGrowName.orEmpty(),
                level = response?.level ?: 0,
                townStats = response?.toTownStats() ?: emptyTownStats()
            )
        } catch (ex: Exception) {
            logger.error("DNF 캐릭터 상태 조회 실패 (serverId={}, characterId={}): {}", serverId, characterId, ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "캐릭터 상태 정보를 불러오지 못했습니다.")
        }
    }

    private fun fetchEquipment(serverId: String, characterId: String): List<EquipmentAggregate> {
        val apiKey = apiKey()
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

            response?.equipment.orEmpty().map { slot ->
                val slotName = (slot.slotName ?: slot.slotId)?.ifBlank { slot.slotId } ?: "UNKNOWN"
                val damage = slot.damage ?: 0L
                val buff = slot.buff ?: 0L
                EquipmentAggregate(
                    slotName = slotName,
                    itemId = slot.itemId,
                    itemName = slot.itemName ?: slot.itemId,
                    damageValue = damage,
                    buffPower = buff,
                    // Parse Set Point from Rarity
                    setPoint = calculateSetPoint(slot.itemRarity, slot.itemName),
                    itemGrade = slot.itemRarity ?: "EPIC"
                )
            }
        } catch (ex: Exception) {
            logger.error("DNF 장비 조회 실패 (serverId={}, characterId={}): {}", serverId, characterId, ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "장비 정보를 불러오지 못했습니다.")
        }
    }

    private fun fetchAvatar(serverId: String, characterId: String): List<DnfAvatar> {
        val apiKey = apiKey()
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

            response?.avatar.orEmpty().map { avatar ->
                val slotName = (avatar.slotName ?: avatar.slotId)?.ifBlank { avatar.slotId } ?: "UNKNOWN"
                val emblems = avatar.emblems.orEmpty()
                    .mapNotNull { it.name }
                    .filter { it.isNotBlank() }
                val buffPower = extractBuffPower(emblems.joinToString(" "))
                DnfAvatar(slotName = slotName, emblems = emblems, buffPower = buffPower)
            }
        } catch (ex: Exception) {
            logger.error("DNF 아바타 조회 실패 (serverId={}, characterId={}): {}", serverId, characterId, ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "아바타 정보를 불러오지 못했습니다.")
        }
    }

    private fun fetchCreature(serverId: String, characterId: String): DnfCreature? {
        val apiKey = apiKey()
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

            response?.creature?.let { creature ->
                val artifacts = creature.artifacts.orEmpty()
                    .mapNotNull { it.name }
                    .filter { it.isNotBlank() }
                val artifactExplain = creature.artifacts.orEmpty().mapNotNull { it.explain }.joinToString(" ")
                val creatureBuff = extractBuffPower(artifactExplain.ifBlank { creature.explain })
                val creatureDamage = extractDamageValue(artifactExplain.ifBlank { creature.explain })
                DnfCreature(
                    name = creature.itemName.orEmpty(),
                    artifactStats = artifacts,
                    buffPower = creatureBuff,
                    damageBonus = creatureDamage
                )
            }
        } catch (ex: Exception) {
            logger.error("DNF 크리쳐 조회 실패 (serverId={}, characterId={}): {}", serverId, characterId, ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "크리쳐 정보를 불러오지 못했습니다.")
        }
    }

    private fun fetchAndCacheItemDetails(itemIds: Collection<String>) {
        val futures = itemIds.map { id ->
            CompletableFuture.supplyAsync { id to fetchItemDetail(id) }
        }
        futures.forEach { future ->
            val (itemId, options) = future.join()
            itemFixedOptionCache[itemId] = options
        }
    }

    private fun fetchItemDetail(itemId: String): ItemFixedOptions {
        val apiKey = apiKey()
        return try {
            val detailNode = restClient.get()
                .uri { builder ->
                    builder
                        .path("/items/{itemId}")
                        .queryParam("apikey", apiKey)
                        .build(itemId)
                }
                .retrieve()
                .body(JsonNode::class.java)

            parseItemFixedOptions(detailNode)
        } catch (ex: Exception) {
            logger.warn("아이템 상세 조회 실패 (itemId={}): {}", itemId, ex.message)
            ItemFixedOptions(
                skillAtkIncrease = 0.0,
                damageIncrease = 0.0,
                additionalDamage = 0.0,
                finalDamage = 0.0,
                criticalDamage = 0.0,
                cooldownReduction = 0.0,
                cooldownRecovery = 0.0,
                elementalDamage = 0,
                defensePenetration = 0.0,
                levelOptions = emptyMap()
            )
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

        fun pickElement(vararg keys: String): Int {
            val lowerKeys = keys.map { it.lowercase(Locale.getDefault()) }
            val match = status.firstOrNull { entry ->
                val name = entry.name?.lowercase(Locale.getDefault()) ?: return@firstOrNull false
                lowerKeys.any { key -> name.contains(key) }
            }
            return match?.value?.toInt() ?: 0
        }

        return TownStats(
            strength = pick("힘", "str"),
            intelligence = pick("지능", "int"),
            vitality = pick("체력", "vitality", "vit"),
            spirit = pick("정신", "정신력", "spirit"),
            physicalAttack = pick("물리공", "physical"),
            magicalAttack = pick("마법공", "magical"),
            independentAttack = pick("독립공", "independent"),
            elementInfo = ElementInfo(
                fire = pickElement("화속", "fire"),
                water = pickElement("수속", "water"),
                light = pickElement("명속", "빛", "light"),
                shadow = pickElement("암속", "dark", "shadow")
            )
        )
    }

    private fun parseItemFixedOptions(detail: JsonNode?): ItemFixedOptions {
        if (detail == null) {
            return ItemFixedOptions(
                skillAtkIncrease = 0.0,
                damageIncrease = 0.0,
                additionalDamage = 0.0,
                finalDamage = 0.0,
                criticalDamage = 0.0,
                cooldownReduction = 0.0,
                cooldownRecovery = 0.0,
                elementalDamage = 0,
                defensePenetration = 0.0,
                levelOptions = emptyMap()
            )
        }

        val textBucket = buildString {
            detail.get("itemExplain")?.asText()?.let { appendLine(it) }
            detail.get("itemFlavorText")?.asText()?.let { appendLine(it) }
            detail.get("itemFixedOption")?.get("explain")?.asText()?.let { appendLine(it) }
            append(detail.toString())
        }

        val skillAtk = parsePercent(SKILL_ATK_PATTERN, textBucket)
        val damageIncrease = parsePercent(DAMAGE_INCREASE_PATTERN, textBucket)
        val additionalDamage = parsePercent(ADDITIONAL_DAMAGE_PATTERN, textBucket)
        val finalDamage = parsePercent(FINAL_DAMAGE_PATTERN, textBucket)
        val criticalDamage = parsePercent(CRITICAL_DAMAGE_PATTERN, textBucket)
        val cooldownReduction = parsePercent(COOLDOWN_REDUCTION_PATTERN, textBucket)
        val cooldownRecovery = parsePercent(COOLDOWN_RECOVERY_PATTERN, textBucket)
        val defensePenetration = parsePercent(DEFENSE_PIERCE_PATTERN, textBucket)
        val elementalDamage = ELEMENTAL_DAMAGE_PATTERN.find(textBucket)?.groupValues?.getOrNull(1)?.toIntOrNull() ?: 0

        val levelOptions = parseLevelOptions(detail)

        return ItemFixedOptions(
            skillAtkIncrease = skillAtk,
            damageIncrease = damageIncrease,
            additionalDamage = additionalDamage,
            finalDamage = finalDamage,
            criticalDamage = criticalDamage,
            cooldownReduction = cooldownReduction,
            cooldownRecovery = cooldownRecovery,
            elementalDamage = elementalDamage,
            defensePenetration = defensePenetration,
            levelOptions = levelOptions
        )
    }

    private fun parsePercent(pattern: Regex, text: String): Double {
        val match = pattern.find(text) ?: return 0.0
        val rawNumber = match.groupValues.getOrNull(1)?.replace(",", "") ?: return 0.0
        return rawNumber.toDoubleOrNull()?.div(100.0) ?: 0.0
    }

    private fun extractBuffPower(text: String?): Long =
        BUFF_PATTERN.findAll(text.orEmpty()).sumOf { match ->
            match.groupValues.getOrNull(1)?.replace(",", "")?.toLongOrNull() ?: 0L
        }

    private fun extractDamageValue(text: String?): Long =
        DAMAGE_PATTERN.findAll(text.orEmpty()).sumOf { match ->
            match.groupValues.getOrNull(1)?.replace(",", "")?.toLongOrNull() ?: 0L
        }

    private fun parseLevelOptions(detail: JsonNode?): Map<Int, LevelOption> {
        detail ?: return emptyMap()
        val levelNode = detail.get("levelOptions") ?: detail.at("/itemBuff/skill/level")
        if (levelNode == null || !levelNode.isArray) return emptyMap()

        val options = mutableMapOf<Int, LevelOption>()
        levelNode.forEach { node ->
            val level = node.get("level")?.asInt()
            if (level != null) {
                val explain = node.get("explain")?.asText() ?: node.toString()
                val skillAtk = parsePercent(SKILL_ATK_PATTERN, explain)
                val cdr = parsePercent(COOLDOWN_REDUCTION_PATTERN, explain)
                val damageIncrease = parsePercent(DAMAGE_INCREASE_PATTERN, explain)
                val additionalDamage = parsePercent(ADDITIONAL_DAMAGE_PATTERN, explain)
                val finalDamage = parsePercent(FINAL_DAMAGE_PATTERN, explain)
                val criticalDamage = parsePercent(CRITICAL_DAMAGE_PATTERN, explain)
                options[level] = LevelOption(
                    skillAtkInc = skillAtk,
                    cdr = cdr,
                    damageIncrease = damageIncrease,
                    additionalDamage = additionalDamage,
                    finalDamage = finalDamage,
                    criticalDamage = criticalDamage
                )
            }
        }
        return options
    }

    private fun apiKey(): String =
        properties.apiKey ?: throw IllegalStateException("DNF API 키(DNF_API_KEY)가 설정되지 않았습니다.")

    private fun emptyTownStats(): TownStats = TownStats(
        strength = 0,
        intelligence = 0,
        vitality = 0,
        spirit = 0,
        physicalAttack = 0,
        magicalAttack = 0,
        independentAttack = 0,
        elementInfo = ElementInfo(fire = 0, water = 0, light = 0, shadow = 0)
    )

    private data class StatusAggregate(
        val serverId: String,
        val characterId: String,
        val jobName: String,
        val advancementName: String,
        val level: Int,
        val townStats: TownStats
    )

    private data class EquipmentAggregate(
        val slotName: String,
        val itemId: String,
        val itemName: String,
        val damageValue: Long,
        val buffPower: Long,
        val setPoint: Int,
        val itemGrade: String
    )

    // 2025 Season Heuristic
    private fun calculateSetPoint(rarity: String?, name: String?): Int {
        val r = rarity?.uppercase(Locale.getDefault()) ?: ""
        val n = name?.uppercase(Locale.getDefault()) ?: ""
        
        return when {
            // "Techo" or "Genesis" or "God" tier
            r.contains("태초") || r.contains("GENESIS") || r.contains("TECHO") -> 200
            // Standard Epic
            r.contains("에픽") || r.contains("EPIC") -> 100
            // Legacy / Legend
            r.contains("레전더리") || r.contains("LEGEND") -> 50
            else -> 10 // Basic
        } + if (n.contains("+")) 10 else 0 // Bonus for Tuning/Reinforce visualization
    }

    companion object {
        private val SKILL_ATK_PATTERN = Regex("""스킬\s*공격력[^\\d]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        private val DAMAGE_INCREASE_PATTERN = Regex("""(?:피해|데미지)\s*증가[^\d-]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        private val ADDITIONAL_DAMAGE_PATTERN = Regex("""추가\s*(?:피해|데미지)[^\d-]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        private val FINAL_DAMAGE_PATTERN = Regex("""최종\s*(?:피해|데미지)[^\d-]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        private val CRITICAL_DAMAGE_PATTERN = Regex("""크리티컬(?:\s*(?:공격력|피해))?[^\d-]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        private val COOLDOWN_REDUCTION_PATTERN = Regex("""쿨타임\s*감소[^\\d]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        private val COOLDOWN_RECOVERY_PATTERN = Regex("""쿨타임\s*회복[^\\d]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        private val ELEMENTAL_DAMAGE_PATTERN = Regex("""모든\s*속성\s*강화[^\\d]*([\d]+)""", RegexOption.IGNORE_CASE)
        private val DEFENSE_PIERCE_PATTERN = Regex("""방어력\s*무시[^\d-]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        private val BUFF_PATTERN = Regex("""(?:버프|buff)[^\d-]*([\d,]+)""", RegexOption.IGNORE_CASE)
        private val DAMAGE_PATTERN = Regex("""(?:피해|증가)[^\d-]*([\d,]+)""", RegexOption.IGNORE_CASE)
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

data class CharacterStatusResponse(
    val serverId: String? = null,
    val characterId: String? = null,
    val characterName: String? = null,
    val jobName: String? = null,
    val jobGrowName: String? = null,
    val level: Int? = null,
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
    val slotName: String? = null,
    val itemId: String,
    val itemName: String? = null,
    val explain: String? = null,
    val damage: Long? = null,
    val buff: Long? = null,
    val itemRarity: String? = null // Added for 2025 Season
)

data class AvatarResponse(
    val avatar: List<AvatarItem> = emptyList()
)

data class AvatarItem(
    val slotId: String? = null,
    val slotName: String? = null,
    val emblems: List<AvatarEmblem> = emptyList()
)

data class AvatarEmblem(
    val name: String? = null
)

data class CreatureResponse(
    val creature: CreatureItem? = null
)

data class CreatureItem(
    val itemName: String? = null,
    val explain: String? = null,
    val artifacts: List<ArtifactItem> = emptyList()
)

data class ArtifactItem(
    val name: String? = null,
    val explain: String? = null
)

data class JobListResponse(
    val rows: List<JobRow> = emptyList()
)

data class JobRow(
    val jobId: String,
    val jobName: String,
    val rows: List<JobGrowRow> = emptyList()
)

data class JobGrowRow(
    val jobGrowId: String,
    val jobGrowName: String,
    val next: JobGrowRow? = null
)

data class SkillListResponse(
    @com.fasterxml.jackson.annotation.JsonProperty("skills")
    val skills: List<SkillSummary> = emptyList(),
    val rows: List<SkillSummary> = emptyList()
) {
    fun resolved(): List<SkillSummary> = when {
        skills.isNotEmpty() -> skills
        else -> rows
    }
}

data class SkillSummary(
    val skillId: String,
    val name: String,
    val type: String? = null
)

data class SkillDetailResponse(
    val name: String? = null,
    val type: String? = null,
    val desc: String? = null,
    val descDetail: String? = null,
    val consumeItem: ConsumeItem? = null,
    val maxLevel: Int? = null,
    val requiredLevel: Int? = null,
    val requiredLevelRange: Int? = null,
    val preRequiredSkill: Any? = null,
    val jobId: String? = null,
    val jobName: String? = null,
    val jobGrowLevel: List<String>? = null,
    val levelInfo: SkillLevelInfo? = null
) {
    data class ConsumeItem(
        val itemId: String? = null,
        val itemName: String? = null,
        val value: Int? = null
    )

    data class SkillLevelInfo(
        val optionDesc: String? = null,
        val rows: List<SkillLevelRow> = emptyList()
    )

    data class SkillLevelRow(
        val level: Int? = null,
        val consumeMp: Int? = null,
        val coolTime: Double? = null,
        val castingTime: Double? = null,
        val optionValue: Map<String, Any>? = null
    )
}

data class CharacterLoadoutBundle(
    val serverId: String,
    val characterId: String,
    val timeline: JsonNode? = null,
    val status: JsonNode? = null,
    val equipment: JsonNode? = null,
    val avatar: JsonNode? = null,
    val creature: JsonNode? = null,
    val flag: JsonNode? = null,
    val mistAssimilation: JsonNode? = null,
    val skillStyle: JsonNode? = null,
    val buffEquipment: JsonNode? = null,
    val buffAvatar: JsonNode? = null,
    val buffCreature: JsonNode? = null
)
