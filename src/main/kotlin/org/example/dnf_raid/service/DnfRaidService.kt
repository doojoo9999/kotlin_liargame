package org.example.dnf_raid.service

import org.example.dnf_raid.dto.*
import org.example.dnf_raid.model.DnfParticipantEntity
import org.example.dnf_raid.model.DnfRaidEntity
import org.example.dnf_raid.model.DnfStatHistoryEntity
import org.example.dnf_raid.repository.DnfParticipantRepository
import org.example.dnf_raid.repository.DnfRaidRepository
import org.example.dnf_raid.repository.DnfStatHistoryRepository
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDateTime
import java.util.UUID

@Service
class DnfRaidService(
    private val raidRepository: DnfRaidRepository,
    private val participantRepository: DnfParticipantRepository,
    private val statHistoryRepository: DnfStatHistoryRepository,
    private val characterService: DnfCharacterService
) {

    @Transactional
    fun createRaid(request: CreateRaidRequest): RaidDetailResponse {
        val raid = raidRepository.save(
            DnfRaidEntity(
                userId = request.userId,
                motherRaidId = request.motherRaidId,
                name = request.name,
                password = request.password,
                isPublic = request.isPublic
            )
        )
        if (raid.motherRaidId == null) {
            raid.motherRaidId = raid.id
            raidRepository.save(raid)
        }
        return toRaidDetailResponse(raid, emptyList())
    }

    @Transactional
    fun cloneRaid(parentRaidId: UUID, request: CloneRaidRequest): RaidDetailResponse {
        val parent = raidRepository.findById(parentRaidId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "원본 레이드를 찾을 수 없습니다.") }

        val clone = raidRepository.save(
            DnfRaidEntity(
                userId = parent.userId,
                motherRaidId = parent.motherRaidId ?: parent.id,
                name = request.name ?: "${parent.name} 복사본",
                password = parent.password,
                isPublic = request.isPublic ?: parent.isPublic
            )
        )

        val participants = loadUniqueParticipants(parent.id!!)
        participants.forEach { origin ->
            val copy = DnfParticipantEntity(
                raid = clone,
                character = origin.character,
                damage = origin.damage,
                buffPower = origin.buffPower,
                partyNumber = origin.partyNumber,
                slotIndex = origin.slotIndex,
                cohortPreference = origin.cohortPreference
            )
            participantRepository.save(copy)
            statHistoryRepository.save(
                DnfStatHistoryEntity(
                    participant = copy,
                    damage = copy.damage,
                    buffPower = copy.buffPower
                )
            )
        }

        val clonedParticipants = loadUniqueParticipants(clone.id!!)
        return toRaidDetailResponse(clone, clonedParticipants)
    }

    @Transactional(readOnly = true)
    fun getRaid(raidId: UUID): RaidDetailResponse {
        val raid = raidRepository.findById(raidId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.") }
        val participants = loadUniqueParticipants(raid.id!!)
        return toRaidDetailResponse(raid, participants)
    }

    @Transactional(readOnly = true)
    fun getLatestRaid(userId: String): RaidDetailResponse? {
        val latest = raidRepository.findFirstByUserIdOrderByCreatedAtDesc(userId) ?: return null
        val participants = loadUniqueParticipants(latest.id!!)
        return toRaidDetailResponse(latest, participants)
    }

    @Transactional(readOnly = true)
    fun getRaidGroup(motherRaidId: UUID): RaidGroupResponse {
        val raids = resolveCohorts(motherRaidId)
        if (raids.isEmpty()) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.")
        }

        val primary = raids.first()
        val participantCounts = participantRepository.countByRaidIds(raids.mapNotNull { it.id })
            .associateBy({ it.raidId }, { it.count })

        val cohorts = raids.map { raid ->
            RaidSummaryResponse(
                id = raid.id!!,
                name = raid.name,
                motherRaidId = raid.motherRaidId ?: raid.id!!,
                isPublic = raid.isPublic,
                createdAt = raid.createdAt,
                participantCount = (participantCounts[raid.id] ?: 0L).toInt()
            )
        }

        val primaryParticipants = loadUniqueParticipants(primary.id!!)
        return RaidGroupResponse(
            motherRaidId = primary.motherRaidId ?: primary.id!!,
            name = primary.name,
            isPublic = primary.isPublic,
            primaryRaid = toRaidDetailResponse(primary, primaryParticipants),
            cohorts = cohorts
        )
    }

    @Transactional(readOnly = true)
    fun getRecentRaids(userId: String, limit: Int?): List<RaidSummaryResponse> {
        val size = when {
            limit == null -> 4
            limit < 1 -> 1
            limit > 8 -> 8
            else -> limit
        }
        val raids = raidRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, size))
        if (raids.isEmpty()) return emptyList()

        val counts = participantRepository.countByRaidIds(raids.mapNotNull { it.id })
            .associateBy({ it.raidId }, { it.count })

        return raids.map {
            RaidSummaryResponse(
                id = it.id!!,
                name = it.name,
                motherRaidId = it.motherRaidId ?: it.id!!,
                isPublic = it.isPublic,
                createdAt = it.createdAt,
                participantCount = (counts[it.id] ?: 0).toInt()
            )
        }
    }

    @Transactional(readOnly = true)
    fun searchRaidsByName(name: String, limit: Int?): List<RaidSummaryResponse> {
        val trimmed = name.trim()
        if (trimmed.isEmpty()) return emptyList()
        val size = when {
            limit == null -> 20
            limit < 1 -> 1
            limit > 50 -> 50
            else -> limit
        }
        val raids = raidRepository.findByNameContainingIgnoreCaseAndIsPublicTrueOrderByCreatedAtDesc(
            trimmed,
            PageRequest.of(0, size)
        )
        if (raids.isEmpty()) return emptyList()

        val counts = participantRepository.countByRaidIds(raids.mapNotNull { it.id })
            .associateBy({ it.raidId }, { it.count })

        return raids.map {
            RaidSummaryResponse(
                id = it.id!!,
                name = it.name,
                motherRaidId = it.motherRaidId ?: it.id!!,
                isPublic = it.isPublic,
                createdAt = it.createdAt,
                participantCount = (counts[it.id] ?: 0).toInt()
            )
        }
    }

    @Transactional
    fun addParticipant(raidId: UUID, request: AddParticipantRequest): ParticipantResponse {
        val raid = raidRepository.findById(raidId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.") }

        val participant = createParticipant(raid, request)
        return toParticipantResponse(participant)
    }

    @Transactional
    fun addParticipantByMother(motherRaidId: UUID, request: AddParticipantRequest): ParticipantResponse {
        val raids = resolveCohorts(motherRaidId)
        val target = raids.firstOrNull()
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.")

        val participant = createParticipant(target, request)
        return toParticipantResponse(participant)
    }

    @Transactional
    fun addParticipantsByMother(motherRaidId: UUID, request: AddParticipantBatchRequest): RaidDetailResponse {
        val raids = resolveCohorts(motherRaidId)
        val target = raids.firstOrNull()
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.")

        request.participants.forEach { addRequest ->
            createParticipant(target, addRequest)
        }

        val participants = loadUniqueParticipants(target.id!!)
        return toRaidDetailResponse(target, participants)
    }

    @Transactional
    fun addParticipants(raidId: UUID, request: AddParticipantBatchRequest): RaidDetailResponse {
        val raid = raidRepository.findById(raidId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.") }

        request.participants.forEach { addRequest ->
            createParticipant(raid, addRequest)
        }

        val participants = loadUniqueParticipants(raid.id!!)
        return toRaidDetailResponse(raid, participants)
    }

    @Transactional
    fun registerCharacter(request: RegisterCharacterRequest): DnfCharacterDto {
        if (request.damage < 0 || request.buffPower < 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "딜/버프는 0 이상이어야 합니다.")
        }
        return characterService.registerCharacter(request.serverId, request.characterId, request.damage, request.buffPower)
    }

    @Transactional
    fun updateParticipant(
        raidId: UUID,
        participantId: UUID,
        request: UpdateParticipantRequest
    ): ParticipantResponse {
        val participant = participantRepository.findById(participantId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "참가자를 찾을 수 없습니다.") }

        if (participant.raid.id != raidId) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 레이드 참가자가 아닙니다.")
        }

        var statsChanged = false

        request.damage?.let {
            participant.damage = it
            statsChanged = true
        }
        request.buffPower?.let {
            participant.buffPower = it
            statsChanged = true
        }
        participant.partyNumber = request.partyNumber
        participant.slotIndex = request.slotIndex

        val saved = participantRepository.save(participant)

        if (statsChanged) {
            statHistoryRepository.save(
                DnfStatHistoryEntity(
                    participant = saved,
                    damage = saved.damage,
                    buffPower = saved.buffPower
                )
            )
        }

        return toParticipantResponse(saved)
    }

    @Transactional
    fun deleteParticipant(raidId: UUID, participantId: UUID) {
        val participant = participantRepository.findById(participantId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "참가자를 찾을 수 없습니다.") }

        if (participant.raid.id != raidId) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 레이드 참가자가 아닙니다.")
        }

        val id = participant.id ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "참가자를 찾을 수 없습니다.")
        statHistoryRepository.deleteByParticipantId(id)
        participantRepository.delete(participant)
    }

    @Transactional
    fun deleteParticipantsByAdventure(raidId: UUID, adventureName: String?): RaidDetailResponse {
        val raid = raidRepository.findById(raidId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.") }

        val normalizedAdventure = adventureName?.trim()?.ifEmpty { null }
        participantRepository.deleteByRaidIdAndAdventureName(raid.id!!, normalizedAdventure)

        val remaining = loadUniqueParticipants(raid.id!!)
        return toRaidDetailResponse(raid, remaining)
    }

    @Transactional
    fun updateRaidVisibility(raidId: UUID, request: UpdateRaidVisibilityRequest): RaidDetailResponse {
        val raid = raidRepository.findById(raidId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.") }

        raid.isPublic = request.isPublic
        val saved = raidRepository.save(raid)

        val participants = loadUniqueParticipants(saved.id!!)
        return toRaidDetailResponse(saved, participants)
    }

    @Transactional(readOnly = true)
    fun getStatHistory(participantId: UUID): StatHistoryResponse {
        val participant = participantRepository.findById(participantId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "참가자를 찾을 수 없습니다.") }

        val history = statHistoryRepository.findByParticipantIdOrderByCreatedAtAsc(participantId)
        val entries = history.map {
            StatHistoryEntryResponse(
                id = it.id!!,
                damage = it.damage,
                buffPower = it.buffPower,
                createdAt = it.createdAt
            )
        }
        return StatHistoryResponse(participantId = participant.id!!, history = entries)
    }

    private fun toRaidDetailResponse(
        raid: DnfRaidEntity,
        participants: List<DnfParticipantEntity>
    ): RaidDetailResponse =
        RaidDetailResponse(
            id = raid.id!!,
            name = raid.name,
            userId = raid.userId,
            isPublic = raid.isPublic,
            motherRaidId = raid.motherRaidId ?: raid.id!!,
            createdAt = raid.createdAt,
            participants = participants.map { toParticipantResponse(it) }
        )

    private fun resolveCohorts(motherRaidId: UUID): List<DnfRaidEntity> {
        val byMother = raidRepository.findByMotherRaidIdOrderByCreatedAtAsc(motherRaidId)
        if (byMother.isNotEmpty()) return byMother

        val single = raidRepository.findById(motherRaidId)
        if (single.isPresent) {
            val raid = single.get()
            val actualMotherId = raid.motherRaidId ?: raid.id!!
            if (raid.motherRaidId == null) {
                raid.motherRaidId = actualMotherId
                raidRepository.save(raid)
            }
            val cohorts = raidRepository.findByMotherRaidIdOrderByCreatedAtAsc(actualMotherId)
            return if (cohorts.isNotEmpty()) cohorts else listOf(raid)
        }

        return emptyList()
    }

    private fun toParticipantResponse(entity: DnfParticipantEntity): ParticipantResponse =
        ParticipantResponse(
            id = entity.id!!,
            raidId = entity.raid.id!!,
            damage = entity.damage,
            buffPower = entity.buffPower,
            partyNumber = entity.partyNumber,
            slotIndex = entity.slotIndex,
            cohortPreference = entity.cohortPreference,
            character = characterService.toDto(entity.character),
            createdAt = entity.createdAt
        )

    private fun loadUniqueParticipants(raidId: UUID): List<DnfParticipantEntity> =
        latestUniqueParticipants(participantRepository.findByRaidIdOrderByCreatedAtDesc(raidId))

    private fun latestUniqueParticipants(participants: List<DnfParticipantEntity>): List<DnfParticipantEntity> {
        val seen = linkedMapOf<String, DnfParticipantEntity>()
        participants.sortedByDescending { it.createdAt ?: LocalDateTime.MIN }.forEach { participant ->
            val key = participant.character.characterId
            if (!seen.containsKey(key)) {
                seen[key] = participant
            }
        }
        return seen.values.toList()
    }

    private fun createParticipant(raid: DnfRaidEntity, request: AddParticipantRequest): DnfParticipantEntity {
        val character = characterService.getOrRefresh(request.serverId, request.characterId)

        // 기존 동일 캐릭터 신청 제거 후 최신 신청만 유지
        participantRepository.deleteByRaidIdAndCharacterId(raid.id!!, character.characterId)

        val participant = participantRepository.save(
            DnfParticipantEntity(
                raid = raid,
                character = character,
                damage = request.damage ?: 0,
                buffPower = request.buffPower ?: 0,
                partyNumber = request.partyNumber,
                slotIndex = request.slotIndex,
                cohortPreference = request.cohortPreference
            )
        )

        statHistoryRepository.save(
            DnfStatHistoryEntity(
                participant = participant,
                damage = participant.damage,
                buffPower = participant.buffPower
            )
        )

        return participant
    }
}
