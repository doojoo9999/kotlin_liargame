package org.example.dnf_raid.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.example.dnf_raid.dto.DnfCharacterLoadoutDto
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

    private fun JsonNode?.stringify(): String? =
        this?.let { node ->
            runCatching { objectMapper.writeValueAsString(node) }
                .onFailure { ex -> logger.warn("Failed to serialize loadout fragment: {}", ex.message) }
                .getOrNull()
        }
}
