package org.example.dnf_raid.service

import org.example.dnf_raid.config.DnfApiProperties
import org.example.dnf_raid.dto.DnfCharacterDto
import org.example.dnf_raid.model.DnfCharacterEntity
import org.example.dnf_raid.repository.DnfCharacterRepository
import org.springframework.data.domain.PageRequest
import org.slf4j.LoggerFactory
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

    private val logger = LoggerFactory.getLogger(DnfCharacterService::class.java)
    private val cacheTtl = Duration.ofHours(properties.cacheTtlHours)
    private val adventureRefreshInterval = Duration.ofMinutes(1)

    @Transactional
    fun searchCharacters(serverId: String, characterName: String, limit: Int = 20): List<DnfCharacterDto> {
        val normalizedServerId = serverId.trim().lowercase()
        if (normalizedServerId !in VALID_SERVER_IDS) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 서버입니다.")
        }

        val apiResults = dnfApiClient.searchCharacters(normalizedServerId, characterName, limit)
            .sortedWith(
                compareBy<DnfCharacterApiResponse> { levenshtein(characterName.lowercase(), it.characterName.lowercase()) }
                    .thenByDescending { it.fame }
            )
        val now = LocalDateTime.now()

        return apiResults.map { apiCharacter ->
            val cached = characterRepository.findById(apiCharacter.characterId).orElse(null)
            val shouldRefreshAdventure = cached?.adventureName.isNullOrBlank() &&
                (cached?.lastUpdatedAt?.isBefore(now.minus(adventureRefreshInterval)) != false)

            val freshCharacter = if (shouldRefreshAdventure) {
                runCatching { dnfApiClient.fetchCharacter(normalizedServerId, apiCharacter.characterId) }
                    .onFailure { ex ->
                        logger.warn("모험단 새로고침 실패 (serverId={}, characterId={}): {}", normalizedServerId, apiCharacter.characterId, ex.message)
                    }
                    .getOrNull() ?: apiCharacter
            } else {
                apiCharacter
            }

            val entity = cached ?: DnfCharacterEntity(
                characterId = freshCharacter.characterId,
                serverId = freshCharacter.serverId,
            characterName = freshCharacter.characterName,
            jobName = freshCharacter.jobName,
            jobGrowName = freshCharacter.jobGrowName,
            fame = freshCharacter.fame,
            damage = cached?.damage ?: 0,
            buffPower = cached?.buffPower ?: 0,
            adventureName = freshCharacter.adventureName,
            lastUpdatedAt = now
        )
            entity.apply {
                this.serverId = freshCharacter.serverId
                this.characterName = freshCharacter.characterName
                this.jobName = freshCharacter.jobName
                this.jobGrowName = freshCharacter.jobGrowName
                this.fame = freshCharacter.fame
                // keep saved stats unless provided elsewhere
                // Preserve existing adventureName if API omits it to keep adventure search usable
                this.adventureName = freshCharacter.adventureName ?: this.adventureName
                this.lastUpdatedAt = now
            }

            characterRepository.save(entity)
            toDto(entity)
        }
    }

    @Transactional(readOnly = true)
    fun searchByAdventureName(adventureName: String, limit: Int = 20): List<DnfCharacterDto> {
        val pageRequest = PageRequest.of(0, limit.coerceIn(1, 200))
        val cached = characterRepository.findByAdventureNameContainingIgnoreCase(adventureName, pageRequest)
        return cached.map { toDto(it) }
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
            cached.adventureName = apiCharacter.adventureName ?: cached.adventureName
            cached.lastUpdatedAt = now
            cached
        }

        return characterRepository.save(entity)
    }

    @Transactional
    fun registerCharacter(serverId: String, characterId: String, damage: Long, buffPower: Long): DnfCharacterDto {
        val entity = getOrRefresh(serverId, characterId)
        entity.damage = damage
        entity.buffPower = buffPower
        entity.lastUpdatedAt = LocalDateTime.now()
        return toDto(characterRepository.save(entity))
    }

    fun toDto(entity: DnfCharacterEntity): DnfCharacterDto =
        DnfCharacterDto(
            characterId = entity.characterId,
            serverId = entity.serverId,
            characterName = entity.characterName,
            jobName = entity.jobName,
            jobGrowName = entity.jobGrowName,
            fame = entity.fame,
            damage = entity.damage,
            buffPower = entity.buffPower,
            adventureName = entity.adventureName,
            imageUrl = dnfApiClient.buildCharacterImageUrl(entity.serverId, entity.characterId)
        )

    companion object {
        private val VALID_SERVER_IDS = setOf(
            "cain",
            "diregie",
            "siroco",
            "prey",
            "casillas",
            "hilder",
            "anton",
            "bakal"
        )

        private fun levenshtein(a: String, b: String): Int {
            if (a == b) return 0
            if (a.isEmpty()) return b.length
            if (b.isEmpty()) return a.length

            val prev = IntArray(b.length + 1) { it }
            val curr = IntArray(b.length + 1)

            for (i in a.indices) {
                curr[0] = i + 1
                for (j in b.indices) {
                    val cost = if (a[i] == b[j]) 0 else 1
                    curr[j + 1] = minOf(
                        curr[j] + 1,           // insertion
                        prev[j + 1] + 1,       // deletion
                        prev[j] + cost         // substitution
                    )
                }
                System.arraycopy(curr, 0, prev, 0, prev.size)
            }
            return prev[b.length]
        }
    }
}
