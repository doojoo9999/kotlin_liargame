package org.example.dnf_raid.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.example.dnf_raid.dto.DnfCharacterLoadoutDto
import org.example.dnf_raid.dto.ManualCharacterInput
import org.example.dnf_raid.model.DnfCharacterLoadoutEntity
import org.example.dnf_raid.repository.DnfCharacterLoadoutRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class DnfCharacterLoadoutService(
    private val apiClient: DnfApiClient,
    private val characterService: DnfCharacterService,
    private val loadoutRepository: DnfCharacterLoadoutRepository,
    private val objectMapper: ObjectMapper
) {

    private val logger = LoggerFactory.getLogger(DnfCharacterLoadoutService::class.java)

    /**
     * Fetches all gear-related endpoints (equipment/avatar/creature/flag/mist/skill-style + buff gear + timeline)
     * and persists the raw payloads for later damage calculation.
     */
    @Transactional
    fun refreshAndPersist(
        serverId: String,
        characterId: String,
        timelineLimit: Int = 20
    ): DnfCharacterLoadoutDto {
        val normalizedServerId = serverId.trim().lowercase()

        // Ensure character row exists and is fresh enough
        val character = characterService.getOrRefresh(normalizedServerId, characterId)

        val loadout = apiClient.fetchCharacterLoadoutRaw(normalizedServerId, characterId, timelineLimit)

        val entity = loadoutRepository.findById(characterId).orElse(
            DnfCharacterLoadoutEntity(
                characterId = character.characterId,
                serverId = normalizedServerId
            )
        )

        entity.serverId = normalizedServerId
        entity.timelineJson = loadout.timeline.stringify()
        entity.statusJson = loadout.status.stringify()
        entity.equipmentJson = loadout.equipment.stringify()
        entity.avatarJson = loadout.avatar.stringify()
        entity.creatureJson = loadout.creature.stringify()
        entity.flagJson = loadout.flag.stringify()
        entity.mistAssimilationJson = loadout.mistAssimilation.stringify()
        entity.skillStyleJson = loadout.skillStyle.stringify()
        entity.buffEquipmentJson = loadout.buffEquipment.stringify()
        entity.buffAvatarJson = loadout.buffAvatar.stringify()
        entity.buffCreatureJson = loadout.buffCreature.stringify()
        entity.updatedAt = LocalDateTime.now()

        val saved = loadoutRepository.save(entity)

        return DnfCharacterLoadoutDto(
            characterId = saved.characterId,
            serverId = saved.serverId,
            updatedAt = saved.updatedAt,
            fields = mapOf(
                "timeline" to !saved.timelineJson.isNullOrBlank(),
                "status" to !saved.statusJson.isNullOrBlank(),
                "equipment" to !saved.equipmentJson.isNullOrBlank(),
                "avatar" to !saved.avatarJson.isNullOrBlank(),
                "creature" to !saved.creatureJson.isNullOrBlank(),
                "flag" to !saved.flagJson.isNullOrBlank(),
                "mistAssimilation" to !saved.mistAssimilationJson.isNullOrBlank(),
                "skillStyle" to !saved.skillStyleJson.isNullOrBlank(),
                "buffEquipment" to !saved.buffEquipmentJson.isNullOrBlank(),
                "buffAvatar" to !saved.buffAvatarJson.isNullOrBlank(),
                "buffCreature" to !saved.buffCreatureJson.isNullOrBlank()
            )
        )
    }

    /**
     * 등록된 캐릭터 전체와 수동으로 입력된 캐릭터 목록을 한 번에 동기화한다.
     * - includeRegistered=true이면 dnf_characters 테이블의 모든 캐릭터를 포함
     * - manualCharacters는 사이트에서 입력한 캐릭터 목록(serverId, characterId)
     */
    @Transactional
    fun refreshRegisteredAndManual(
        includeRegistered: Boolean,
        manualCharacters: List<ManualCharacterInput>,
        staleMinutes: Int = 0
    ): List<DnfCharacterLoadoutDto> {
        val registeredTargets = if (includeRegistered) {
            characterService.listAllCharacters().map { it.serverId to it.characterId }
        } else {
            emptyList()
        }

        val manualTargets = manualCharacters
            .mapNotNull { input ->
                val server = input.serverId.trim().lowercase()
                val character = input.characterId.trim()
                if (server.isBlank() || character.isBlank()) null else server to character
            }

        val uniqueTargets = (registeredTargets + manualTargets).distinctBy { it.second }
        val existing = loadoutRepository.findAllByCharacterIdIn(uniqueTargets.map { it.second })
            .associateBy { it.characterId }
        val targetsToSync = uniqueTargets.filter { (_, characterId) ->
            val loadout = existing[characterId]
            loadout == null || loadout.hasMissingSections() || loadout.isStale(staleMinutes)
        }
        val results = mutableListOf<DnfCharacterLoadoutDto>()

        targetsToSync.forEach { (serverId, characterId) ->
            runCatching { refreshAndPersist(serverId, characterId) }
                .onSuccess { results += it }
                .onFailure { ex ->
                    logger.warn("Failed to sync loadout (serverId={}, characterId={}): {}", serverId, characterId, ex.message)
                }
        }
        return results
    }

    private fun DnfCharacterLoadoutEntity.hasMissingSections(): Boolean =
        listOf(
            timelineJson,
            statusJson,
            equipmentJson,
            avatarJson,
            creatureJson,
            flagJson,
            mistAssimilationJson,
            skillStyleJson,
            buffEquipmentJson,
            buffAvatarJson,
            buffCreatureJson
        ).any { it.isNullOrBlank() }

    private fun DnfCharacterLoadoutEntity.isStale(staleMinutes: Int): Boolean {
        if (staleMinutes <= 0) return false
        val threshold = LocalDateTime.now().minusMinutes(staleMinutes.toLong())
        return updatedAt.isBefore(threshold)
    }

    private fun JsonNode?.stringify(): String? =
        this?.let { node ->
            runCatching { objectMapper.writeValueAsString(node) }
                .onFailure { ex -> logger.warn("Failed to serialize loadout fragment: {}", ex.message) }
                .getOrNull()
        }
}
