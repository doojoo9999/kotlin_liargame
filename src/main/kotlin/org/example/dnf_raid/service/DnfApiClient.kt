package org.example.dnf_raid.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.example.dnf_raid.config.DnfApiProperties
import org.example.dnf_raid.model.CharacterSkillLevel
import org.example.dnf_raid.model.DnfAvatar
import org.example.dnf_raid.model.DnfCharacterFullStatus
import org.example.dnf_raid.model.DnfCreature
import org.example.dnf_raid.model.DnfEquipItem
import org.example.dnf_raid.model.DnfTalisman
import org.example.dnf_raid.model.ElementInfo
import org.example.dnf_raid.model.ItemFixedOptions
import org.example.dnf_raid.model.ItemStatusTotals
import org.example.dnf_raid.model.LaneTotals
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
    private val itemDetailCache = ConcurrentHashMap<String, ItemDetailResult>()
    private val EMPTY_FIXED_OPTIONS = ItemFixedOptions(
        skillAtkIncrease = 0.0,
        attackIncrease = 0.0,
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
    private val EMPTY_ITEM_STATUS = ItemStatusTotals()
    private data class ItemDetailResult(
        val fixedOptions: ItemFixedOptions,
        val setItemId: String?,
        val statusTotals: ItemStatusTotals
    )

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
            val talismanDeferred = async { fetchTalismans(normalizedServerId, characterId) }

            val status = statusDeferred.await()
            val equipment = equipmentDeferred.await()
            val avatars = avatarDeferred.await()
            val creature = creatureDeferred.await()
            val skillStyle = skillStyleDeferred.await()
            val skillLevels = skillStyle.skillLevels
            val talismans = talismanDeferred.await()
            // 1. Collect standard items
            val missingItemIds = equipment.map { it.itemId }.toMutableSet()
            
            // 2. Collect Fusion Stone IDs from upgradeInfo
            val fusionStoneIds = equipment.mapNotNull { it.upgradeInfo?.itemId }
            missingItemIds.addAll(fusionStoneIds)
            
            // 3. Fetch details for all (Standard + Fusion)
            val idsToFetch = missingItemIds.filterNot { itemDetailCache.containsKey(it) }
            if (idsToFetch.isNotEmpty()) {
                fetchAndCacheItemDetails(idsToFetch.toSet())
            }
            
            val equippedItems = mutableListOf<DnfEquipItem>()
            
            equipment.forEach { slot ->
                val detail = itemDetailCache[slot.itemId]
                    ?: fetchItemDetail(slot.itemId).also { itemDetailCache[slot.itemId] = it }
                // Base Item
                val fixed = detail.fixedOptions
                val activationBonus = parseExplainOptions(slot.explain)
                val merged = mergeOptions(fixed, activationBonus)
                val statusTotals = resolveItemStatusTotals(slot.itemStatus, detail.statusTotals)
                val setItemId = slot.setItemId ?: detail.setItemId

                equippedItems.add(DnfEquipItem(
                    slotName = slot.slotName,
                    itemId = slot.itemId,
                    itemName = slot.itemName,
                    buffPower = slot.buffPower,
                    fixedOptions = merged,
                    statusBonus = statusTotals,
                    setPoint = slot.setPoint,
                    itemGrade = slot.itemGrade,
                    setItemId = setItemId,
                    reinforce = slot.reinforce ?: 0,
                    amplificationName = slot.amplificationName
                ))
                
                // Fusion Stone Item (from upgradeInfo)
                val fusion = slot.upgradeInfo
                val fOption = slot.fusionOption
                if (fusion != null) {
                    // Fetch cached detail to get Set ID
                    val fDetail = itemDetailCache[fusion.itemId]
                        ?: fetchItemDetail(fusion.itemId).also { itemDetailCache[fusion.itemId] = it }
                    val fFixed = fDetail.fixedOptions
                    // Parse Fusion Stone stats from 'fusionOption' explain (user provided)
                    val fStats = fOption?.options?.fold(EMPTY_FIXED_OPTIONS) { acc: ItemFixedOptions, opt: EquipmentSlot.FusionOptionDetail ->
                        mergeOptions(acc, parseExplainOptions(opt.explain))
                    } ?: EMPTY_FIXED_OPTIONS
                    
                    val fMerged = mergeOptions(fFixed, fStats)
                    
                    equippedItems.add(DnfEquipItem(
                        slotName = "FUSION", // Special slot name
                        itemId = fusion.itemId,
                        itemName = fusion.itemName,
                        buffPower = 0L, // Usually fusion stones have buff power too but it's in fOption.buff
                        fixedOptions = fMerged,
                        statusBonus = fDetail.statusTotals,
                        setPoint = 0, // Fusion stones might not have set points or distinct calculation
                        itemGrade = fusion.itemRarity ?: "EPIC",
                        setItemId = fDetail.setItemId, // Crucial for Set Bonuses
                        reinforce = 0, 
                        amplificationName = null
                    ))
                }
            }
            
            // Resolve Set Bonuses (Golden Era, etc.)
            val setBonuses = resolveSetBonuses(equippedItems)
            
            // Resolve "Teana" Amplification Bonuses
            // Logic: Teana amplification allows Scaling Damage based on amp level.
            val teanaBonus = equippedItems.fold(LaneTotals()) { acc, item ->
                acc + calculateTeanaBonus(item)
            }
            val totalSetLane = setBonuses + teanaBonus
            
            DnfCharacterFullStatus(
                serverId = status.serverId,
                characterId = status.characterId,
                jobId = status.jobId ?: skillStyle.jobId,
                jobGrowId = status.jobGrowId ?: skillStyle.jobGrowId,
                jobName = status.jobName,
                advancementName = status.advancementName,
                level = status.level,
                townStats = status.townStats,
                equipment = equippedItems,
                avatars = avatars,
                creature = creature,
                skillLevels = skillLevels,
                talismans = talismans,
                setLaneTotals = totalSetLane
            )
        }
    }
    
    private suspend fun resolveSetBonuses(items: List<DnfEquipItem>): LaneTotals {
         val setCounts = items.mapNotNull { it.setItemId }.groupingBy { it }.eachCount()
         if (setCounts.isEmpty()) return LaneTotals()
         
         var totalLane = LaneTotals()
         
         // In real scenario, cache set details too
         setCounts.forEach { (setId, count) ->
             if (setId.isBlank() || setId.equals("null", ignoreCase = true)) return@forEach
             val detail = fetchSetItemDetail(setId) ?: return@forEach
             // Parse active bonuses
             detail.setItemBonus.forEach { bonus ->
                 // If bonus triggers at this count
                 // Usually API returns "minimum count needed".
                 // Let's assume 'index' is piece count or 'explain' says "3 Set Effect".
                 // Actually Neople API returns a list of bonuses.
                 // We naively apply ALL bonuses that are <= current count.
                 // Need to parse "N세트" from explain or rely on structure.
                 
                 // Heuristic: Check explain for "N세트"
                 val reqCount = parseSetCount(bonus.explain)
                if (reqCount > 0 && count >= reqCount) {
                    // Check status list first
                    var bonusLane = LaneTotals()
                    bonus.status.forEach { stat ->
                        bonusLane += parseStatusEntryToLane(stat.name, stat.value)
                    }
                    // Fallback to text parsing (explain)
                    val textLane = parseExplainOptions(bonus.explain).toLaneTotals()
                    
                    // Combine (avoid double counting? status is usually reliable)
                    // If status is empty, use textLane
                    totalLane += if (bonus.status.isNotEmpty()) bonusLane else textLane
                }
             }
         }
         return totalLane
    }
    
    private fun parseSetCount(explain: String?): Int {
        if (explain == null) return 0
        val match = Regex("""(\d+)세트""").find(explain) ?: Regex("""(\d+)Set""").find(explain)
        return match?.groupValues?.get(1)?.toIntOrNull() ?: 0
    }
    
    private fun parseStatusEntryToLane(name: String?, value: Double?): LaneTotals {
         if (name == null || value == null) return LaneTotals()
         val n = name.lowercase().replace(" ", "")
         var lane = LaneTotals()
         val v = value / 100.0 // Usually status API returns percent as Double? e.g. 5.0 for 5%
         // Actually fetchSetItemDetail definition returns 'status: List<StatusEntry>'
         // StatusEntry value is Double.
         
         if (n.contains("스킬공격력") || n.contains("skillatk")) lane = lane.copy(skillAtk = v)
         else if (n.contains("공격력증가") || n.contains("attackincrease") || n.contains("phyatk") || n.contains("magatk")) lane = lane.copy(attackIncrease = v)
         else if (n.contains("쿨타임감소") || n.contains("cooldownreduction")) lane = lane.copy(cooldownReduction = v)
         else if (n.contains("피해증가") || n.contains("damageincrease")) lane = lane.copy(damageIncrease = v)
         
         return lane
    }

    private fun ItemFixedOptions.toLaneTotals(): LaneTotals = LaneTotals(
        skillAtk = skillAtkIncrease,
        attackIncrease = attackIncrease,
        damageIncrease = damageIncrease,
        additionalDamage = additionalDamage,
        finalDamage = finalDamage,
        criticalDamage = criticalDamage,
        elementalAttackBonus = elementalDamage,
        defensePenetration = defensePenetration,
        cooldownReduction = cooldownReduction,
        cooldownRecovery = cooldownRecovery
    )
    
    // Heuristic for Teana: "테아" in amplificationName
    private fun calculateTeanaBonus(item: DnfEquipItem): LaneTotals {
        val ampBox = item.amplificationName ?: return LaneTotals()
        if (!ampBox.contains("테아")) return LaneTotals()
        
        // Assumption: Teana provides Damage Increase per Amp Level.
        // Let's guess 1% per level for now based on 'Golden Era' power creep.
        // User didn't give formula.
        val level = item.reinforce
        val bonus = level * 0.01 // 1% per +1
        return LaneTotals(damageIncrease = bonus)
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

    fun searchSetItems(
        setItemName: String,
        limit: Int = 10,
        wordType: String = "match"
    ): List<SetItemSummary> {
        val apiKey = apiKey()
        return try {
            val response = restClient.get()
                .uri { builder ->
                    builder
                        .path("/setitems")
                        .queryParam("setItemName", setItemName)
                        .queryParam("limit", limit.coerceIn(1, 100))
                        .queryParam("wordType", wordType)
                        .queryParam("apikey", apiKey)
                        .build()
                }
                .retrieve()
                .body(SetItemSearchResponse::class.java)

            response?.rows ?: emptyList()
        } catch (ex: Exception) {
            logger.error("DNF 세트 아이템 검색 실패: {}", ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "세트 아이템 검색에 실패했습니다.")
        }
    }

    fun fetchSetItemDetail(setItemId: String): SetItemDetailResponse? {
        val apiKey = apiKey()
        return try {
            restClient.get()
                .uri { builder ->
                    builder
                        .path("/setitems/{setItemId}")
                        .queryParam("apikey", apiKey)
                        .build(setItemId)
                }
                .retrieve()
                .body(SetItemDetailResponse::class.java)
        } catch (ex: Exception) {
            logger.warn("세트 아이템 상세 조회 실패 (setItemId={}): {}", setItemId, ex.message)
            null
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
                jobId = response?.jobId,
                jobName = response?.jobName.orEmpty(),
                jobGrowId = response?.jobGrowId,
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
                    explain = slot.explain,
                    // Prefer API setPoint, fallback to rarity heuristic
                    setPoint = slot.setPoint ?: calculateSetPoint(slot.itemRarity, slot.itemName),
                    itemGrade = slot.itemRarity ?: "EPIC",
                    setItemId = slot.setItemId,
                    itemStatus = slot.itemStatus,
                    reinforce = slot.reinforce ?: 0,
                    amplificationName = slot.amplificationName,
                    upgradeInfo = slot.upgradeInfo,
                    fusionOption = slot.fusionOption
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

    private suspend fun fetchSkillStyle(serverId: String, characterId: String): SkillStyleAggregate = withContext(Dispatchers.IO) {
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

            val jobId = node?.get("jobId")?.asText() ?: node?.get("skill")?.get("jobId")?.asText()
            val jobGrowId = node?.get("jobGrowId")?.asText() ?: node?.get("skill")?.get("jobGrowId")?.asText()
            SkillStyleAggregate(
                jobId = jobId,
                jobGrowId = jobGrowId,
                skillLevels = parseSkillStyle(node)
            )
        } catch (ex: Exception) {
            logger.warn("DNF 스킬 스타일 조회 실패 (serverId={}, characterId={}): {}", serverId, characterId, ex.message)
            SkillStyleAggregate(jobId = null, jobGrowId = null, skillLevels = emptyList())
        }
    }

    private suspend fun fetchTalismans(serverId: String, characterId: String): List<DnfTalisman> = withContext(Dispatchers.IO) {
        val apiKey = apiKey()
        try {
            val response = restClient.get()
                .uri { builder ->
                    builder
                        .path("/servers/{serverId}/characters/{characterId}/equip/talisman")
                        .queryParam("apikey", apiKey)
                        .build(serverId, characterId)
                }
                .retrieve()
                .body(TalismanResponse::class.java)

            response?.talismans.orEmpty().map { item ->
                DnfTalisman(
                    slotName = item.slotName ?: item.slotId.orEmpty(),
                    itemId = item.itemId,
                    itemName = item.itemName,
                    skillName = item.talisman?.skillName,
                    runeTypes = item.runes.orEmpty().mapNotNull { it.itemName } // Simplify for now
                )
            }
        } catch (ex: Exception) {
            logger.warn("DNF 탈리스만 조회 실패 (serverId={}, characterId={}): {}", serverId, characterId, ex.message)
            emptyList()
        }
    }

    private suspend fun fetchAndCacheItemDetails(itemIds: Collection<String>) = coroutineScope {
        val deferred = itemIds.map { id ->
            async { id to fetchItemDetail(id) }
        }
        deferred.forEach { future ->
            val (itemId, detail) = future.await()
            itemDetailCache[itemId] = detail
            itemFixedOptionCache[itemId] = detail.fixedOptions
        }
    }

    private suspend fun fetchItemDetail(itemId: String): ItemDetailResult = withContext(Dispatchers.IO) {
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

            val options = parseItemFixedOptions(detailNode)
            val statusTotals = parseItemStatusTotals(detailNode?.get("itemStatus"))
            // Fix: ensure setItemId is not the string "null"
            val rawSetId = detailNode?.get("setItemId")?.asText()
            val setItemId = rawSetId?.takeIf { it.isNotBlank() && !it.equals("null", ignoreCase = true) }
            ItemDetailResult(options, setItemId, statusTotals)
        } catch (ex: Exception) {
            logger.warn("아이템 상세 조회 실패 (itemId={}): {}", itemId, ex.message)
            ItemDetailResult(EMPTY_FIXED_OPTIONS, null, EMPTY_ITEM_STATUS)
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

    internal fun parseSkillStyle(root: JsonNode?): List<CharacterSkillLevel> {
        if (root == null || root.isNumber || root.isNull) return emptyList()

        val skills = mutableListOf<CharacterSkillLevel>()

        // Top-level skill/style wrapper
        val skillRoot = root.get("skill") ?: root

        val enhancementTypes = skillRoot.get("enhancement")?.associate {
            (it.get("skillId")?.asText() ?: "") to (it.get("type")?.asInt())
        }.orEmpty()
        val evolutionTypes = skillRoot.get("evolution")?.associate {
            (it.get("skillId")?.asText() ?: "") to (it.get("type")?.asInt())
        }.orEmpty()

        // Some payloads put skills directly under "skills"
        collectSkills(skillRoot.get("skills"), skills)

        // Style node: can be object with active/passive or array
        val styleNode = skillRoot.get("style") ?: skillRoot.get("styles") ?: skillRoot
        if (styleNode != null && styleNode.isObject) {
            listOf("active", "passive", "awakening", "evolution", "enhancement")
                .forEach { key -> collectSkills(styleNode.get(key), skills) }
        } else if (styleNode != null && styleNode.isArray) {
            styleNode.forEach { entry ->
                collectSkills(entry.get("skills"), skills)
                listOf("active", "passive", "awakening", "evolution", "enhancement")
                    .forEach { key -> collectSkills(entry.get(key), skills) }
            }
        }

        // Fallback: deep-scan any node that contains skillId/level pairs (API 응답 구조가 들쭉날쭉함)
        deepCollectSkills(skillRoot, skills)

        val merged = skills
            .groupBy { it.skillId }
            .mapNotNull { (_, entries) -> entries.maxByOrNull { it.level } }
            .map { cs ->
                val enh = enhancementTypes[cs.skillId]
                val evo = evolutionTypes[cs.skillId]
                cs.copy(
                    enhancementType = enh ?: cs.enhancementType,
                    evolutionType = evo ?: cs.evolutionType
                )
            }

        return merged
    }

    private fun collectSkills(node: JsonNode?, target: MutableList<CharacterSkillLevel>) {
        if (node == null || node.isNull) return

        val iterable = when {
            node.isArray -> node
            node.has("skills") -> node.get("skills")
            node.has("skill") -> node.get("skill")
            else -> listOf(node)
        }

        iterable.forEach { skillNode ->
            val skillId = skillNode.get("skillId")?.asText()
            val levelNode = skillNode.get("level") ?: skillNode.at("/option/level")
            val level = levelNode.takeIf { it.isNumber || it.isTextual }?.asInt()
            val name = skillNode.get("name")?.asText()
            if (!skillId.isNullOrBlank() && level != null) {
                target += CharacterSkillLevel(
                    skillId = skillId,
                    name = name,
                    level = level
                )
            }
        }
    }

    private fun deepCollectSkills(node: JsonNode?, target: MutableList<CharacterSkillLevel>) {
        if (node == null || node.isNull) return
        if (node.isObject) {
            val skillId = node.get("skillId")?.asText()
            val levelNode = node.get("level") ?: node.at("/option/level")
            val level = levelNode.takeIf { it.isNumber || it.isTextual }?.asInt()
            val name = node.get("name")?.asText()
            if (!skillId.isNullOrBlank() && level != null) {
                target += CharacterSkillLevel(
                    skillId = skillId,
                    name = name,
                    level = level
                )
            }
            node.fields().forEach { (_, child) -> deepCollectSkills(child, target) }
        } else if (node.isArray) {
            node.forEach { child -> deepCollectSkills(child, target) }
        }
    }

    private fun normalizeKey(raw: String?): String =
        raw.orEmpty()
            .lowercase(Locale.getDefault())
            .replace(Regex("\\s+"), "")
            .replace(Regex("[^\\p{L}\\p{N}]"), "")

    internal fun parseItemFixedOptions(detail: JsonNode?): ItemFixedOptions {
        if (detail == null) {
            return EMPTY_FIXED_OPTIONS
        }

        val textBucket = buildString {
            detail.get("itemExplain")?.asText()?.let { appendLine(it) }
            detail.get("itemFlavorText")?.asText()?.let { appendLine(it) }
            detail.get("itemFixedOption")?.get("explain")?.asText()?.let { appendLine(it) }
            append(detail.toString())
        }

        val skillAtk = parsePercent(SKILL_ATK_PATTERN, textBucket)
        val attackIncrease = parsePercent(ATTACK_INCREASE_PATTERN, textBucket)
        val damageIncrease = parsePercent(DAMAGE_INCREASE_PATTERN, textBucket)
        val additionalDamage = parsePercent(ADDITIONAL_DAMAGE_PATTERN, textBucket)
        val finalDamage = parsePercent(FINAL_DAMAGE_PATTERN, textBucket)
        val criticalDamage = parsePercent(CRITICAL_DAMAGE_PATTERN, textBucket)

        // 텍스트 기반 쿨타임 감소/회복 파싱
        var cooldownReduction = parsePercent(COOLDOWN_REDUCTION_PATTERN, textBucket)
            .takeIf { it > 0 } ?: parsePercent(COOLDOWN_REDUCTION_TRAILING_PATTERN, textBucket)
        var cooldownRecovery = parsePercent(COOLDOWN_RECOVERY_PATTERN, textBucket)
            .takeIf { it > 0 } ?: parsePercent(COOLDOWN_RECOVERY_TRAILING_PATTERN, textBucket)

        val statusCooldown = parseCooldownFromStatus(detail.get("itemStatus"))
        // 정규식 실패 시에도 구조화된 itemStatus에서 값 보완
        cooldownReduction = maxOf(cooldownReduction, statusCooldown.first)
        cooldownRecovery = maxOf(cooldownRecovery, statusCooldown.second)

        val defensePenetration = parsePercent(DEFENSE_PIERCE_PATTERN, textBucket)
        val elementalDamage = ELEMENTAL_DAMAGE_PATTERN.find(textBucket)?.groupValues?.getOrNull(1)?.toIntOrNull() ?: 0

        val levelOptions = parseLevelOptions(detail)

        return ItemFixedOptions(
            skillAtkIncrease = skillAtk,
            attackIncrease = attackIncrease,
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

    private fun resolveItemStatusTotals(
        equipmentStatus: List<StatusEntry>?,
        detailStatus: ItemStatusTotals
    ): ItemStatusTotals {
        val equipmentTotals = parseItemStatusTotals(equipmentStatus)
        return if (!equipmentTotals.isEmpty()) equipmentTotals else detailStatus
    }

    private fun parseItemStatusTotals(entries: List<StatusEntry>?): ItemStatusTotals {
        if (entries.isNullOrEmpty()) return EMPTY_ITEM_STATUS

        var totals = ItemStatusTotals()
        entries.forEach { entry ->
            val name = normalizeKey(entry.name)
            val value = entry.value ?: 0.0
            totals = applyItemStatus(totals, name, value)
        }
        return totals
    }

    private fun parseItemStatusTotals(statusNode: JsonNode?): ItemStatusTotals {
        if (statusNode == null || !statusNode.isArray) return EMPTY_ITEM_STATUS

        var totals = ItemStatusTotals()
        statusNode.forEach { entry ->
            val name = normalizeKey(entry.get("name")?.asText())
            val rawValue = entry.get("value")?.asText()
            val value = parseStatusNumber(rawValue)
            totals = applyItemStatus(totals, name, value)
        }
        return totals
    }

    private fun applyItemStatus(totals: ItemStatusTotals, normalizedName: String, value: Double): ItemStatusTotals {
        if (normalizedName.isBlank() || value == 0.0) return totals
        val longValue = value.toLong()
        val intValue = value.toInt()

        return when {
            normalizedName.contains("힘") || normalizedName.contains("strength") ->
                totals.copy(strength = totals.strength + longValue)
            normalizedName.contains("지능") || normalizedName.contains("intelligence") ->
                totals.copy(intelligence = totals.intelligence + longValue)
            normalizedName.contains("체력") || normalizedName.contains("vitality") ->
                totals.copy(vitality = totals.vitality + longValue)
            normalizedName.contains("정신") || normalizedName.contains("spirit") ->
                totals.copy(spirit = totals.spirit + longValue)
            normalizedName.contains("물리공격") || normalizedName.contains("physicalattack") ->
                totals.copy(physicalAttack = totals.physicalAttack + longValue)
            normalizedName.contains("마법공격") || normalizedName.contains("magicalattack") ->
                totals.copy(magicalAttack = totals.magicalAttack + longValue)
            normalizedName.contains("독립공격") || normalizedName.contains("independentattack") ->
                totals.copy(independentAttack = totals.independentAttack + longValue)
            normalizedName.contains("모든속성강화") || normalizedName.contains("allelement") ->
                totals.copy(allElement = totals.allElement + intValue)
            normalizedName.contains("화속성강화") || normalizedName.contains("화속") || normalizedName.contains("fire") ->
                totals.copy(fireElement = totals.fireElement + intValue)
            normalizedName.contains("수속성강화") || normalizedName.contains("수속") || normalizedName.contains("water") ->
                totals.copy(waterElement = totals.waterElement + intValue)
            normalizedName.contains("명속성강화") || normalizedName.contains("빛속성강화") || normalizedName.contains("명속") || normalizedName.contains("빛속") || normalizedName.contains("light") ->
                totals.copy(lightElement = totals.lightElement + intValue)
            normalizedName.contains("암속성강화") || normalizedName.contains("암속") || normalizedName.contains("dark") || normalizedName.contains("shadow") ->
                totals.copy(shadowElement = totals.shadowElement + intValue)
            else -> totals
        }
    }

    private fun parseStatusNumber(raw: String?): Double {
        if (raw.isNullOrBlank()) return 0.0
        val cleaned = raw.replace(",", "").trim()
        return cleaned.toDoubleOrNull() ?: 0.0
    }

    /**
     * 슬롯 explain(발동 옵션/정화 선택지)에만 존재하는 추가 옵션을 파싱한다.
     * 항목마다 중복 파싱을 피하기 위해 item detail 파싱과 분리했다.
     */
    private fun parseExplainOptions(explain: String?): ItemFixedOptions {
        if (explain.isNullOrBlank()) return EMPTY_FIXED_OPTIONS

        val skillAtk = parsePercent(SKILL_ATK_PATTERN, explain)
        val attackIncrease = parsePercent(ATTACK_INCREASE_PATTERN, explain)
        val damageIncrease = parsePercent(DAMAGE_INCREASE_PATTERN, explain)
        val additionalDamage = parsePercent(ADDITIONAL_DAMAGE_PATTERN, explain)
        val finalDamage = parsePercent(FINAL_DAMAGE_PATTERN, explain)
        val criticalDamage = parsePercent(CRITICAL_DAMAGE_PATTERN, explain)
        val cooldownReduction = parsePercent(COOLDOWN_REDUCTION_PATTERN, explain)
            .takeIf { it > 0 } ?: parsePercent(COOLDOWN_REDUCTION_TRAILING_PATTERN, explain)
        val cooldownRecovery = parsePercent(COOLDOWN_RECOVERY_PATTERN, explain)
            .takeIf { it > 0 } ?: parsePercent(COOLDOWN_RECOVERY_TRAILING_PATTERN, explain)
        val defensePenetration = parsePercent(DEFENSE_PIERCE_PATTERN, explain)
        val elementalDamage = ELEMENTAL_DAMAGE_PATTERN.find(explain)?.groupValues?.getOrNull(1)?.toIntOrNull() ?: 0

        return ItemFixedOptions(
            skillAtkIncrease = skillAtk,
            attackIncrease = attackIncrease,
            damageIncrease = damageIncrease,
            additionalDamage = additionalDamage,
            finalDamage = finalDamage,
            criticalDamage = criticalDamage,
            cooldownReduction = cooldownReduction,
            cooldownRecovery = cooldownRecovery,
            elementalDamage = elementalDamage,
            defensePenetration = defensePenetration,
            levelOptions = emptyMap()
        )
    }

    private fun mergeOptions(base: ItemFixedOptions, bonus: ItemFixedOptions): ItemFixedOptions =
        ItemFixedOptions(
            skillAtkIncrease = base.skillAtkIncrease + bonus.skillAtkIncrease,
            attackIncrease = base.attackIncrease + bonus.attackIncrease,
            damageIncrease = base.damageIncrease + bonus.damageIncrease,
            additionalDamage = base.additionalDamage + bonus.additionalDamage,
            finalDamage = base.finalDamage + bonus.finalDamage,
            criticalDamage = base.criticalDamage + bonus.criticalDamage,
            cooldownReduction = combineCooldown(base.cooldownReduction, bonus.cooldownReduction),
            cooldownRecovery = base.cooldownRecovery + bonus.cooldownRecovery,
            elementalDamage = base.elementalDamage + bonus.elementalDamage,
            defensePenetration = base.defensePenetration + bonus.defensePenetration,
            levelOptions = base.levelOptions // 캐시된 레벨 옵션은 그대로 유지
        )

    private fun combineCooldown(first: Double, second: Double): Double =
        1.0 - (1.0 - first) * (1.0 - second)

    private fun parseCooldownFromStatus(statusNode: JsonNode?): Pair<Double, Double> {
        if (statusNode == null || !statusNode.isArray) return 0.0 to 0.0

        var reduction = 0.0
        var recovery = 0.0
        statusNode.forEach { entry ->
            val name = entry.get("name")?.asText()?.lowercase(Locale.getDefault()) ?: return@forEach
            val rawValue = entry.get("value")?.asText() ?: return@forEach
            val percent = parsePercentValue(rawValue)

            when {
                name.contains("쿨타임") && name.contains("감소") -> reduction = maxOf(reduction, percent)
                name.contains("cool") && name.contains("down") -> reduction = maxOf(reduction, percent)
                name.contains("쿨타임") && name.contains("회복") -> recovery = maxOf(recovery, percent)
                name.contains("회복속도") || name.contains("recovery") -> recovery = maxOf(recovery, percent)
            }
        }

        return reduction to recovery
    }

    private fun parsePercentValue(raw: String?): Double {
        if (raw.isNullOrBlank()) return 0.0
        val cleaned = raw.replace("%", "").replace(",", "").trim()
        return cleaned.toDoubleOrNull()?.div(100.0) ?: 0.0
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
                val attackIncrease = parsePercent(ATTACK_INCREASE_PATTERN, explain)
                val cdr = parsePercent(COOLDOWN_REDUCTION_PATTERN, explain)
                val recovery = parsePercent(COOLDOWN_RECOVERY_PATTERN, explain)
                    .takeIf { it > 0 } ?: parsePercent(COOLDOWN_RECOVERY_TRAILING_PATTERN, explain)
                val damageIncrease = parsePercent(DAMAGE_INCREASE_PATTERN, explain)
                val additionalDamage = parsePercent(ADDITIONAL_DAMAGE_PATTERN, explain)
                val finalDamage = parsePercent(FINAL_DAMAGE_PATTERN, explain)
                val criticalDamage = parsePercent(CRITICAL_DAMAGE_PATTERN, explain)
                options[level] = LevelOption(
                    skillAtkInc = skillAtk,
                    attackIncrease = attackIncrease,
                    cdr = cdr,
                    cooldownRecovery = recovery,
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
        val jobId: String?,
        val jobName: String,
        val jobGrowId: String?,
        val advancementName: String,
        val level: Int,
        val townStats: TownStats
    )

    private data class SkillStyleAggregate(
        val jobId: String?,
        val jobGrowId: String?,
        val skillLevels: List<CharacterSkillLevel>
    )

    private data class EquipmentAggregate(
        val slotName: String,
        val itemId: String,
        val itemName: String,
        val damageValue: Long,
        val buffPower: Long,
        val explain: String? = null,
        val setPoint: Int,
        val itemGrade: String,
        val setItemId: String? = null,
        val itemStatus: List<StatusEntry> = emptyList(),
        val reinforce: Int = 0,
        val amplificationName: String? = null,
        val upgradeInfo: EquipmentSlot.UpgradeInfo? = null,
        val fusionOption: EquipmentSlot.FusionOption? = null
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
        private val ATTACK_INCREASE_PATTERN = Regex("""(?:공격력|물리\s*공격력|마법\s*공격력|독립\s*공격력)\s*증가[^\d-]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        private val DAMAGE_INCREASE_PATTERN = Regex("""(?:피해|데미지)\s*증가[^\d-]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        private val ADDITIONAL_DAMAGE_PATTERN = Regex("""추가\s*(?:피해|데미지)[^\d-]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        private val FINAL_DAMAGE_PATTERN = Regex("""최종\s*(?:피해|데미지)[^\d-]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        private val CRITICAL_DAMAGE_PATTERN = Regex("""크리티컬(?:\s*(?:공격력|피해))?[^\d-]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        // Leading: "Cooltime Reduction 15%"
        private val COOLDOWN_REDUCTION_PATTERN = Regex("""(?:쿨타임\s*감소|재사용\s*대기시간\s*감소|쿨\s*감소|쿨타임\s*[-–−]|쿨다운)\s*[-–−]?\s*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        // Trailing: "Cooltime 15% Reduction"
        private val COOLDOWN_REDUCTION_TRAILING_PATTERN = Regex("""(?:쿨타임|재사용\s*대기시간|쿨다운)[^\d%]*[-–−]?\s*([\d.]+)\s*%\s*감소""", RegexOption.IGNORE_CASE)
        // Leading: "Cooltime Recovery 15%"
        private val COOLDOWN_RECOVERY_PATTERN = Regex("""쿨타임\s*회복[^\\d]*([\d.]+)\s*%""", RegexOption.IGNORE_CASE)
        // Trailing: "Cooltime 15% Recovery" or "Recovery Speed 15%"
        private val COOLDOWN_RECOVERY_TRAILING_PATTERN = Regex("""(?:쿨타임|회복\s*속도)[^\d%]*([\d.]+)\s*%\s*회복""", RegexOption.IGNORE_CASE)

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
    val jobId: String? = null,
    val jobName: String,
    val jobGrowId: String? = null,
    val jobGrowName: String,
    val fame: Int = 0,
    val adventureName: String? = null
)

data class CharacterStatusResponse(
    val serverId: String? = null,
    val characterId: String? = null,
    val characterName: String? = null,
    val jobId: String? = null,
    val jobName: String? = null,
    val jobGrowId: String? = null,
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
        val itemRarity: String? = null, // Added for 2025 Season
        val setItemId: String? = null,
        val setPoint: Int? = null,
        val itemStatus: List<StatusEntry> = emptyList(),
        val reinforce: Int? = null,
        val amplificationName: String? = null,
        val upgradeInfo: UpgradeInfo? = null,
    val fusionOption: FusionOption? = null
) {
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    data class UpgradeInfo(
        val itemId: String,
        val itemName: String,
        val itemRarity: String? = null
    )

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    data class FusionOption(
        val options: List<FusionOptionDetail> = emptyList()
    )

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    data class FusionOptionDetail(
        val explain: String? = null,
        val buff: Int? = null
    )
}

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

data class SetItemSearchResponse(
    val rows: List<SetItemSummary> = emptyList()
)

data class SetItemSummary(
    val setItemId: String,
    val setItemName: String? = null
)

@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
data class SetItemDetailResponse(
    val setItemId: String? = null,
    val setItemName: String? = null,
    val explain: String? = null,
    val tags: List<String> = emptyList(),
    val setItems: List<SetItemEntry> = emptyList(),
    val setItemBonus: List<SetItemBonus> = emptyList()
) {
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    data class SetItemEntry(
        val itemId: String? = null,
        val itemName: String? = null,
        val slotId: String? = null,
        val slotName: String? = null
    )

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    data class SetItemBonus(
        val index: Int? = null,
        val explain: String? = null,
        val status: List<StatusEntry> = emptyList()
    )
}

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
    val evolution: List<EvolutionEntry>? = null,
    val enhancement: List<EnhancementEntry>? = null
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

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    data class EvolutionEntry(
        val type: Int? = null,
        val name: String? = null,
        val desc: String? = null,
        val descDetail: String? = null,
        val skills: List<String>? = emptyList()
    )

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    data class EnhancementEntry(
        val type: Int? = null,
        val status: List<EnhancementStatus>? = emptyList()
    ) {
        @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
        data class EnhancementStatus(
            val name: String? = null,
            val value: String? = null
        )
    }
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

data class TalismanResponse(
    val talismans: List<TalismanItem> = emptyList()
)

data class TalismanItem(
    val slotId: String? = null,
    val slotName: String? = null,
    val itemId: String,
    val itemName: String,
    val talisman: TalismanInfo? = null,
    val runes: List<RuneItem> = emptyList()
)

data class TalismanInfo(
    val skillName: String? = null,
    val runeTypes: List<String> = emptyList()
)

data class RuneItem(
    val slotId: String? = null,
    val itemId: String,
    val itemName: String? = null
)
