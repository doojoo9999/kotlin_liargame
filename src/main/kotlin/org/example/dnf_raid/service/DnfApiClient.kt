package org.example.dnf_raid.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.example.dnf_raid.config.DnfApiProperties
import org.example.dnf_raid.model.CharacterSkillLevel
import org.example.dnf_raid.model.DnfAvatar
import org.example.dnf_raid.model.DnfCharacterFullStatus
import org.example.dnf_raid.model.DnfCreature
import org.example.dnf_raid.model.DnfEquipItem
import org.example.dnf_raid.model.ElementInfo
import org.example.dnf_raid.model.ItemFixedOptions
import org.example.dnf_raid.model.LevelOption
import org.example.dnf_raid.model.TownStats
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.server.ResponseStatusException
import java.util.Locale
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
    fun fetchCharacterFullStatus(serverId: String, characterId: String): DnfCharacterFullStatus = runBlocking {
        val normalizedServerId = serverId.trim().lowercase(Locale.getDefault())

        coroutineScope {
            val statusDeferred = async { fetchStatus(normalizedServerId, characterId) }
            val equipmentDeferred = async { fetchEquipment(normalizedServerId, characterId) }
            val avatarDeferred = async { fetchAvatar(normalizedServerId, characterId) }
            val creatureDeferred = async { fetchCreature(normalizedServerId, characterId) }
            val skillStyleDeferred = async { fetchSkillStyle(normalizedServerId, characterId) }

            val status = statusDeferred.await()
            val equipment = equipmentDeferred.await()
            val avatars = avatarDeferred.await()
            val creature = creatureDeferred.await()
            val skillLevels = skillStyleDeferred.await()

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

            DnfCharacterFullStatus(
                serverId = status.serverId,
                characterId = status.characterId,
                jobName = status.jobName,
                advancementName = status.advancementName,
                level = status.level,
                townStats = status.townStats,
                equipment = equippedItems,
                avatars = avatars,
                creature = creature,
                skillLevels = skillLevels
            )
        }
    }

    /**
     * Raw loadout snapshot used for DB persistence (timeline + equipment + buff gear).
     */
    fun fetchCharacterLoadoutRaw(
        serverId: String,
        characterId: String,
        timelineLimit: Int = 20
    ): CharacterLoadoutBundle = runBlocking {
        val normalizedServerId = serverId.trim().lowercase(Locale.getDefault())
        val safeLimit = timelineLimit.coerceIn(1, 100)

        coroutineScope {
            val timelineDeferred = async { fetchCharacterNode(normalizedServerId, characterId, "timeline", mapOf("limit" to safeLimit)) }
            val statusDeferred = async { fetchCharacterNode(normalizedServerId, characterId, "status") }
            val equipmentDeferred = async { fetchCharacterNode(normalizedServerId, characterId, "equip/equipment") }
            val avatarDeferred = async { fetchCharacterNode(normalizedServerId, characterId, "equip/avatar") }
            val creatureDeferred = async { fetchCharacterNode(normalizedServerId, characterId, "equip/creature") }
            val flagDeferred = async { fetchCharacterNode(normalizedServerId, characterId, "equip/flag") }
            val mistDeferred = async { fetchCharacterNode(normalizedServerId, characterId, "equip/mist-assimilation") }
            val skillStyleDeferred = async { fetchCharacterNode(normalizedServerId, characterId, "skill/style") }
            val buffEquipmentDeferred = async { fetchCharacterNode(normalizedServerId, characterId, "skill/buff/equip/equipment") }
            val buffAvatarDeferred = async { fetchCharacterNode(normalizedServerId, characterId, "skill/buff/equip/avatar") }
            val buffCreatureDeferred = async { fetchCharacterNode(normalizedServerId, characterId, "skill/buff/equip/creature") }

            CharacterLoadoutBundle(
                serverId = normalizedServerId,
                characterId = characterId,
                timeline = timelineDeferred.await(),
                status = statusDeferred.await(),
                equipment = equipmentDeferred.await(),
                avatar = avatarDeferred.await(),
                creature = creatureDeferred.await(),
                flag = flagDeferred.await(),
                mistAssimilation = mistDeferred.await(),
                skillStyle = skillStyleDeferred.await(),
                buffEquipment = buffEquipmentDeferred.await(),
                buffAvatar = buffAvatarDeferred.await(),
                buffCreature = buffCreatureDeferred.await()
            )
        }
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

    private suspend fun fetchCharacterNode(
        serverId: String,
        characterId: String,
        subPath: String,
        queryParams: Map<String, Any?> = emptyMap()
    ): JsonNode? = withContext(Dispatchers.IO) {
        val apiKey = apiKey()
        try {
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
                .body(JsonNode::class.java).also { node ->
                    if (node == null || node.isNumber || node.isNull) {
                        throw ResponseStatusException(
                            HttpStatus.BAD_GATEWAY,
                            "DNF API returned invalid payload for $subPath (server=$serverId, character=$characterId)"
                        )
                    }
                }
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

    private suspend fun fetchStatus(serverId: String, characterId: String): StatusAggregate = withContext(Dispatchers.IO) {
        val apiKey = apiKey()
        try {
            val response = restClient.get()
                .uri { builder ->
                    builder
                        .path("/servers/{serverId}/characters/{characterId}/status")
                        .queryParam("apikey", apiKey)
                        .build(serverId, characterId)
                }
                .retrieve()
                .body(CharacterStatusResponse::class.java)?.also { resp ->
                    if (resp.status.isEmpty()) {
                        throw ResponseStatusException(
                            HttpStatus.BAD_GATEWAY,
                            "DNF 상태 정보가 비어 있습니다 (serverId=$serverId, characterId=$characterId)"
                        )
                    }
                }

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

    private suspend fun fetchEquipment(serverId: String, characterId: String): List<EquipmentAggregate> = withContext(Dispatchers.IO) {
        val apiKey = apiKey()
        try {
            val response = restClient.get()
                .uri { builder ->
                    builder
                        .path("/servers/{serverId}/characters/{characterId}/equip/equipment")
                        .queryParam("apikey", apiKey)
                        .build(serverId, characterId)
                }
                .retrieve()
                .body(EquipmentResponse::class.java)?.also { resp ->
                    if (resp.equipment.isEmpty()) {
                        throw ResponseStatusException(
                            HttpStatus.BAD_GATEWAY,
                            "DNF 장비 정보가 비어 있습니다 (serverId=$serverId, characterId=$characterId)"
                        )
                    }
                }

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

    private suspend fun fetchAvatar(serverId: String, characterId: String): List<DnfAvatar> = withContext(Dispatchers.IO) {
        val apiKey = apiKey()
        try {
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

    private suspend fun fetchCreature(serverId: String, characterId: String): DnfCreature? = withContext(Dispatchers.IO) {
        val apiKey = apiKey()
        try {
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

    private suspend fun fetchSkillStyle(serverId: String, characterId: String): List<CharacterSkillLevel> = withContext(Dispatchers.IO) {
        val apiKey = apiKey()
        try {
            val node = restClient.get()
                .uri { builder ->
                    builder
                        .path("/servers/{serverId}/characters/{characterId}/skill/style")
                        .queryParam("apikey", apiKey)
                        .build(serverId, characterId)
                }
                .retrieve()
                .body(JsonNode::class.java)

            parseSkillStyle(node)
        } catch (ex: Exception) {
            logger.warn("DNF 스킬 스타일 조회 실패 (serverId={}, characterId={}): {}", serverId, characterId, ex.message)
            emptyList()
        }
    }

    private suspend fun fetchAndCacheItemDetails(itemIds: Collection<String>) = coroutineScope {
        val deferred = itemIds.map { id ->
            async { id to fetchItemDetail(id) }
        }
        deferred.forEach { future ->
            val (itemId, options) = future.await()
            itemFixedOptionCache[itemId] = options
        }
    }

    private suspend fun fetchItemDetail(itemId: String): ItemFixedOptions = withContext(Dispatchers.IO) {
        val apiKey = apiKey()
        try {
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
        fun pick(keys: List<String>): Long = pickByKeywords(status, keys)
        fun pickElement(keys: List<String>): Int = pickByKeywords(status, keys).toInt()

        return TownStats(
            strength = pick(listOf("힘", "str", "strength")),
            intelligence = pick(listOf("지능", "int", "intelligence")),
            vitality = pick(listOf("체력", "vitality", "vit")),
            spirit = pick(listOf("정신", "정신력", "spirit")),
            physicalAttack = pick(listOf("물리공격", "물리공", "physicalattack")),
            magicalAttack = pick(listOf("마법공격", "마법공", "magicattack", "magicalattack")),
            independentAttack = pick(listOf("독립공격", "독립공", "independentattack")),
            elementInfo = ElementInfo(
                fire = pickElement(listOf("화속성강화", "화속", "fire")),
                water = pickElement(listOf("수속성강화", "수속", "water")),
                light = pickElement(listOf("명속성강화", "빛속성강화", "명속", "빛속", "light")),
                shadow = pickElement(listOf("암속성강화", "암속", "dark", "shadow"))
            )
        )
    }

    private fun pickByKeywords(entries: List<StatusEntry>, keywords: List<String>): Long {
        val normalizedTargets = keywords.map { normalizeKey(it) }
        val hit = entries.firstOrNull { entry ->
            val normName = normalizeKey(entry.name)
            normalizedTargets.any { target -> normName.contains(target) }
        }
        return hit?.value?.toLong() ?: 0L
    }

    private fun parseSkillStyle(root: JsonNode?): List<CharacterSkillLevel> {
        if (root == null || root.isNumber || root.isNull) return emptyList()

        val skills = mutableListOf<CharacterSkillLevel>()

        // Some payloads put skills directly under "skills"
        if (root.has("skills")) {
            collectSkills(root.get("skills"), skills)
        }

        val styleNodes = when {
            root.has("styles") -> root.get("styles")
            root.has("style") -> root.get("style")
            root.isArray -> root
            else -> null
        }

        collectSkills(styleNodes, skills)

        styleNodes?.forEach { style ->
            val skillArray = when {
                style.has("skills") -> style.get("skills")
                style.has("skill") -> style.get("skill")
                else -> null
            } ?: return@forEach
            collectSkills(skillArray, skills)
        }

        return skills
            .groupBy { it.skillId }
            .mapNotNull { (_, entries) -> entries.maxByOrNull { it.level } }
    }

    private fun collectSkills(node: JsonNode?, target: MutableList<CharacterSkillLevel>) {
        if (node == null || node.isNull) return
        val iterable = if (node.isArray) node else listOf(node)
        iterable.forEach { skillNode ->
            val skillId = skillNode.get("skillId")?.asText()
            val level = skillNode.get("level")?.asInt()
            val name = skillNode.get("name")?.asText()
            if (!skillId.isNullOrBlank() && level != null) {
                target += CharacterSkillLevel(skillId = skillId, name = name, level = level)
            }
        }
    }

    private fun normalizeKey(raw: String?): String =
        raw.orEmpty()
            .lowercase(Locale.getDefault())
            .replace(Regex("\\s+"), "")
            .replace(Regex("[^\\p{L}\\p{N}]"), "")

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
    val emblems: List<AvatarEmblem>? = emptyList()
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

@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
data class SkillDetailResponse(
    val name: String? = null,
    val type: String? = null,
    val desc: String? = null,
    val descDetail: String? = null,
    val descSpecial: List<String>? = emptyList(),
    val consumeItem: ConsumeItem? = null,
    val maxLevel: Int? = null,
    val requiredLevel: Int? = null,
    val requiredLevelRange: Int? = null,
    val preRequiredSkill: Any? = null,
    val jobId: String? = null,
    val jobName: String? = null,
    val jobGrowLevel: List<String>? = null,
    val levelInfo: SkillLevelInfo? = null,
    val evolution: List<Any>? = null,
    val enhancement: List<Any>? = null
) {
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    data class ConsumeItem(
        val itemId: String? = null,
        val itemName: String? = null,
        val value: Int? = null
    )

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    data class SkillLevelInfo(
        val optionDesc: String? = null,
        val rows: List<SkillLevelRow> = emptyList()
    )

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
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
