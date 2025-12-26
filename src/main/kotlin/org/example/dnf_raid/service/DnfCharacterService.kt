package org.example.dnf_raid.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.example.dnf_raid.config.DnfApiProperties
import org.example.dnf_raid.dto.DamageCalculationDetailDto
import org.example.dnf_raid.dto.DealerDamageDetailDto
import org.example.dnf_raid.dto.DealerSkillScoreDto
import org.example.dnf_raid.dto.DnfCharacterDto
import org.example.dnf_raid.model.DnfCharacterEntity
import org.example.dnf_raid.model.DnfCalculatedDamageEntity
import org.example.dnf_raid.repository.DnfCharacterRepository
import org.example.dnf_raid.repository.DnfCalculatedDamageRepository
import org.example.dnf_raid.util.toEok
import org.example.dnf_raid.util.toMan
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
    private val calculatedDamageRepository: DnfCalculatedDamageRepository,
    private val powerCalculator: DnfPowerCalculator,
    private val objectMapper: ObjectMapper,
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
            jobId = freshCharacter.jobId,
            jobGrowId = freshCharacter.jobGrowId,
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
                this.jobId = freshCharacter.jobId ?: this.jobId
                this.jobGrowId = freshCharacter.jobGrowId ?: this.jobGrowId
                this.fame = freshCharacter.fame
                // keep saved stats unless provided elsewhere
                // Preserve existing adventureName if API omits it to keep adventure search usable
                this.adventureName = freshCharacter.adventureName ?: this.adventureName
                this.lastUpdatedAt = now
            }

            characterRepository.save(entity)
            val calc = ensureCalculated(entity)
            toDto(entity, calc)
        }
    }

    @Transactional(readOnly = true)
    fun searchByAdventureName(adventureName: String, limit: Int = 20): List<DnfCharacterDto> {
        val pageRequest = PageRequest.of(0, limit.coerceIn(1, 200))
        val cached = characterRepository.findByAdventureNameContainingIgnoreCase(adventureName, pageRequest)
        return cached.map { entity -> toDto(entity, ensureCalculated(entity)) }
    }

    @Transactional(readOnly = true)
    fun listAllCharacters(): List<DnfCharacterEntity> =
        characterRepository.findAll()

    @Transactional(readOnly = true)
    fun listCharactersUpdatedWithinDays(days: Long): List<DnfCharacterEntity> {
        val now = LocalDateTime.now()
        val cutoff = now.minusDays(days)
        return characterRepository.findByLastUpdatedAtAfter(cutoff)
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
                jobId = apiCharacter.jobId,
                jobGrowId = apiCharacter.jobGrowId,
                fame = apiCharacter.fame,
                adventureName = apiCharacter.adventureName,
                lastUpdatedAt = now
            )
        } else {
            cached.serverId = apiCharacter.serverId
            cached.characterName = apiCharacter.characterName
            cached.jobName = apiCharacter.jobName
            cached.jobGrowName = apiCharacter.jobGrowName
            cached.jobId = apiCharacter.jobId ?: cached.jobId
            cached.jobGrowId = apiCharacter.jobGrowId ?: cached.jobGrowId
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
        val saved = applyStats(entity, damage, buffPower)
        return toDto(saved)
    }

    @Transactional
    fun applyStats(character: DnfCharacterEntity, damage: Long, buffPower: Long): DnfCharacterEntity {
        character.damage = damage
        character.buffPower = buffPower
        character.lastUpdatedAt = LocalDateTime.now()
        return characterRepository.save(character)
    }

    fun toDto(entity: DnfCharacterEntity): DnfCharacterDto =
        toDto(entity, null)

    private fun toDto(entity: DnfCharacterEntity, calc: DnfCalculatedDamageEntity?): DnfCharacterDto {
        val calcEntity = calc ?: calculatedDamageRepository.findByCharacterId(entity.characterId)
        return DnfCharacterDto(
            characterId = entity.characterId,
            serverId = entity.serverId,
            characterName = entity.characterName,
            jobName = entity.jobName,
            jobGrowName = entity.jobGrowName,
            jobId = entity.jobId,
            jobGrowId = entity.jobGrowId,
            fame = entity.fame,
            damage = entity.damage,
            buffPower = entity.buffPower,
            calculatedDealer = calcEntity?.dealerScore?.let { toEok(it) },
            calculatedBuffer = calcEntity?.bufferScore?.let { toMan(it) },
            adventureName = entity.adventureName,
            imageUrl = dnfApiClient.buildCharacterImageUrl(entity.serverId, entity.characterId)
        )
    }

    private fun ensureCalculated(entity: DnfCharacterEntity): DnfCalculatedDamageEntity? {
        val existing = calculatedDamageRepository.findByCharacterId(entity.characterId)
        val now = LocalDateTime.now()
        val isFresh = existing?.calculatedAt?.isAfter(now.minusMinutes(5)) == true
        val hasPayload = existing?.calcJson?.isNotBlank() == true
        if (existing != null && isFresh && hasPayload) {
            return existing
        }

        return runCatching {
            val status = dnfApiClient.fetchCharacterFullStatus(entity.serverId, entity.characterId)
            val dealer = powerCalculator.calculateDealerScore(status)
            val bufferScore = powerCalculator.calculateBufferScore(status).toDouble()
            val payload = DamageCalculationPayload(dealer = dealer, bufferScore = bufferScore)
            val calcJson = serializePayload(payload)

            val updated = existing?.apply {
                serverId = status.serverId
                dealerScore = dealer.totalScore
                this.bufferScore = bufferScore
                this.calcJson = calcJson
                calculatedAt = now
                updatedAt = now
            } ?: DnfCalculatedDamageEntity(
                characterId = status.characterId,
                serverId = status.serverId,
                dealerScore = dealer.totalScore,
                bufferScore = bufferScore,
                calcJson = calcJson,
                calculatedAt = now,
                updatedAt = now
            )

            calculatedDamageRepository.save(updated)
        }.onFailure { ex ->
            logger.warn(
                "Failed to calculate damage on search (characterId={}, serverId={}): {}",
                entity.characterId,
                entity.serverId,
                ex.message
            )
        }.getOrNull()
    }

    @Transactional
    fun getDamageDetail(serverId: String, characterId: String): DamageCalculationDetailDto {
        val entity = getOrRefresh(serverId, characterId)
        val calc = ensureCalculated(entity)
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "딜 계산에 실패했습니다.")

        val payload = deserializePayload(calc.calcJson)
            ?: recalculatePayload(serverId, characterId, calc)
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "딜 계산 데이터를 불러오지 못했습니다.")

        return DamageCalculationDetailDto(
            characterId = entity.characterId,
            serverId = entity.serverId,
            dealer = toDealerDetail(payload.dealer),
            bufferScore = payload.bufferScore?.let { toMan(it) },
            calculatedAt = calc.calculatedAt
        )
    }

    private fun recalculatePayload(
        serverId: String,
        characterId: String,
        calc: DnfCalculatedDamageEntity
    ): DamageCalculationPayload? {
        val now = LocalDateTime.now()
        return runCatching {
            val status = dnfApiClient.fetchCharacterFullStatus(serverId, characterId)
            val dealer = powerCalculator.calculateDealerScore(status)
            val bufferScore = powerCalculator.calculateBufferScore(status).toDouble()
            val payload = DamageCalculationPayload(dealer = dealer, bufferScore = bufferScore)
            val calcJson = serializePayload(payload)
            calc.serverId = status.serverId
            calc.dealerScore = dealer.totalScore
            calc.bufferScore = bufferScore
            calc.calcJson = calcJson
            calc.calculatedAt = now
            calc.updatedAt = now
            calculatedDamageRepository.save(calc)
            payload
        }.onFailure { ex ->
            logger.warn(
                "Failed to recalculate damage detail (characterId={}, serverId={}): {}",
                characterId,
                serverId,
                ex.message
            )
        }.getOrNull()
    }

    private fun toDealerDetail(result: DnfPowerCalculator.DealerCalculationResult?): DealerDamageDetailDto? =
        result?.let {
            DealerDamageDetailDto(
                totalScore = toEok(it.totalScore),
                skills = it.topSkills.map { skill ->
                    DealerSkillScoreDto(
                        name = skill.name,
                        level = skill.level,
                        coeff = skill.coeff,
                        baseCd = skill.baseCd,
                        realCd = skill.realCd,
                        singleDamage = toEok(skill.singleDamage),
                        casts = skill.casts,
                        score = toEok(skill.score)
                    )
                }
            )
        }

    private fun serializePayload(payload: DamageCalculationPayload): String? =
        runCatching { objectMapper.writeValueAsString(payload) }
            .onFailure { ex -> logger.warn("Failed to serialize damage calc result: {}", ex.message) }
            .getOrNull()

    private fun deserializePayload(json: String?): DamageCalculationPayload? {
        if (json.isNullOrBlank()) return null
        return runCatching { objectMapper.readValue(json, DamageCalculationPayload::class.java) }
            .onFailure { ex -> logger.warn("Failed to parse damage calc json: {}", ex.message) }
            .getOrNull()
    }

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
