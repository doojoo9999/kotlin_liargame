package org.example.dnf_raid.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.example.dnf_raid.dto.DnfCalculatedDamageDto
import org.example.dnf_raid.model.DnfCalculatedDamageEntity
import org.example.dnf_raid.repository.DnfCalculatedDamageRepository
import org.example.dnf_raid.util.toEok
import org.example.dnf_raid.util.toMan
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class DnfDamageCalculationService(
    private val apiClient: DnfApiClient,
    private val powerCalculator: DnfPowerCalculator,
    private val characterService: DnfCharacterService,
    private val calculatedDamageRepository: DnfCalculatedDamageRepository,
    private val objectMapper: ObjectMapper
) {

    private val logger = LoggerFactory.getLogger(DnfDamageCalculationService::class.java)

    /**
     * dnf_characters.damage는 사용자 수동 입력값으로 유지하고,
     * 계산된 딜/버프 점수는 dnf_calculated_damages에 별도로 저장한다.
     */
    @Transactional
    fun calculateAndPersist(serverId: String, characterId: String): DnfCalculatedDamageDto {
        // 풀 스테이터스 로드
        val status = apiClient.fetchCharacterFullStatus(serverId, characterId)

        // 딜/버프 계산
        val dealerResult = powerCalculator.calculateDealerScore(status)
        val bufferScore = powerCalculator.calculateBufferScore(status).toDouble()

        val payload = DamageCalculationPayload(dealer = dealerResult, bufferScore = bufferScore)
        val calcJson = serializePayload(payload)

        val existing = calculatedDamageRepository.findByCharacterId(characterId)
        val now = LocalDateTime.now()
        val entity = existing?.apply {
            this.serverId = status.serverId
            this.dealerScore = dealerResult.totalScore
            this.bufferScore = bufferScore
            this.calcJson = calcJson
            this.calculatedAt = now
            this.updatedAt = now
        } ?: DnfCalculatedDamageEntity(
            characterId = status.characterId,
            serverId = status.serverId,
            dealerScore = dealerResult.totalScore,
            bufferScore = bufferScore,
            calcJson = calcJson,
            calculatedAt = now,
            updatedAt = now
        )

        val saved = calculatedDamageRepository.save(entity)
        return DnfCalculatedDamageDto(
            characterId = saved.characterId,
            serverId = saved.serverId,
            dealerScore = saved.dealerScore?.let { toEok(it) },
            bufferScore = saved.bufferScore?.let { toMan(it) },
            calculatedAt = saved.calculatedAt
        )
    }

    private fun serializePayload(payload: DamageCalculationPayload): String? =
        runCatching { objectMapper.writeValueAsString(payload) }
            .onFailure { ex -> logger.warn("Failed to serialize damage calc result: {}", ex.message) }
            .getOrNull()

    /**
     * 등록된 모든 캐릭터(또는 limit만큼)에 대해 딜/버프 계산을 수행하고 저장한다.
     */
    @Transactional
    fun calculateForRegistered(updatedWithinDays: Long = 21): List<DnfCalculatedDamageDto> {
        val days = if (updatedWithinDays < 1) 1 else updatedWithinDays
        val targets = characterService.listCharactersUpdatedWithinDays(days)
        val results = mutableListOf<DnfCalculatedDamageDto>()
        targets.forEach { character ->
            runCatching { calculateAndPersist(character.serverId, character.characterId) }
                .onSuccess { results += it }
                .onFailure { ex ->
                    logger.warn(
                        "Failed to calculate damage for characterId={} (serverId={}): {}",
                        character.characterId,
                        character.serverId,
                        ex.message
                    )
                }
        }
        return results
    }
}
