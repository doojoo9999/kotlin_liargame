package org.example.dnf_raid.service

import org.example.dnf_raid.config.DnfApiProperties
import org.example.dnf_raid.dto.DnfCharacterDto
import org.example.dnf_raid.model.DnfCharacterEntity
import org.example.dnf_raid.repository.DnfCharacterRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Duration
import java.time.LocalDateTime

@Service
class DnfCharacterService(
    private val dnfApiClient: DnfApiClient,
    private val characterRepository: DnfCharacterRepository,
    properties: DnfApiProperties
) {

    private val cacheTtl = Duration.ofHours(properties.cacheTtlHours)

    @Transactional
    fun searchCharacters(characterName: String, limit: Int = 20): List<DnfCharacterDto> {
        val apiResults = dnfApiClient.searchCharacters(characterName, limit)
        val now = LocalDateTime.now()

        return apiResults.map { apiCharacter ->
            val entity = characterRepository.findById(apiCharacter.characterId).orElse(
                DnfCharacterEntity(
                    characterId = apiCharacter.characterId,
                    serverId = apiCharacter.serverId,
                    characterName = apiCharacter.characterName,
                    jobName = apiCharacter.jobName,
                    jobGrowName = apiCharacter.jobGrowName,
                    fame = apiCharacter.fame,
                    adventureName = apiCharacter.adventureName,
                    lastUpdatedAt = now
                )
            ).apply {
                serverId = apiCharacter.serverId
                characterName = apiCharacter.characterName
                jobName = apiCharacter.jobName
                jobGrowName = apiCharacter.jobGrowName
                fame = apiCharacter.fame
                adventureName = apiCharacter.adventureName
                lastUpdatedAt = now
            }

            characterRepository.save(entity)
            toDto(entity)
        }
    }

    @Transactional
    fun getOrRefresh(serverId: String, characterId: String): DnfCharacterEntity {
        val cached = characterRepository.findById(characterId).orElse(null)
        val now = LocalDateTime.now()
        val isFresh = cached?.lastUpdatedAt?.isAfter(now.minus(cacheTtl)) == true

        if (cached != null && cached.serverId == serverId && isFresh) {
            return cached
        }

        val apiCharacter = dnfApiClient.fetchCharacter(serverId, characterId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "캐릭터를 찾을 수 없습니다.")

        val entity = if (cached == null) {
            DnfCharacterEntity(
                characterId = apiCharacter.characterId,
                serverId = apiCharacter.serverId,
                characterName = apiCharacter.characterName,
                jobName = apiCharacter.jobName,
                jobGrowName = apiCharacter.jobGrowName,
                fame = apiCharacter.fame,
                adventureName = apiCharacter.adventureName,
                lastUpdatedAt = now
            )
        } else {
            cached.serverId = apiCharacter.serverId
            cached.characterName = apiCharacter.characterName
            cached.jobName = apiCharacter.jobName
            cached.jobGrowName = apiCharacter.jobGrowName
            cached.fame = apiCharacter.fame
            cached.adventureName = apiCharacter.adventureName
            cached.lastUpdatedAt = now
            cached
        }

        return characterRepository.save(entity)
    }

    fun toDto(entity: DnfCharacterEntity): DnfCharacterDto =
        DnfCharacterDto(
            characterId = entity.characterId,
            serverId = entity.serverId,
            characterName = entity.characterName,
            jobName = entity.jobName,
            jobGrowName = entity.jobGrowName,
            fame = entity.fame,
            adventureName = entity.adventureName,
            imageUrl = dnfApiClient.buildCharacterImageUrl(entity.serverId, entity.characterId)
        )
}
