package org.example.dnf_raid.service

import org.example.dnf_raid.dto.*
import org.example.dnf_raid.model.DnfParticipantEntity
import org.example.dnf_raid.model.DnfRaidEntity
import org.example.dnf_raid.model.DnfStatHistoryEntity
import org.example.dnf_raid.repository.DnfParticipantRepository
import org.example.dnf_raid.repository.DnfRaidRepository
import org.example.dnf_raid.repository.DnfStatHistoryRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
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
                name = request.name,
                password = request.password
            )
        )
        return toRaidDetailResponse(raid, emptyList())
    }

    @Transactional
    fun cloneRaid(parentRaidId: UUID, request: CloneRaidRequest): RaidDetailResponse {
        val parent = raidRepository.findById(parentRaidId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "원본 레이드를 찾을 수 없습니다.") }

        val clone = raidRepository.save(
            DnfRaidEntity(
                userId = parent.userId,
                name = request.name ?: "${parent.name} 복사본",
                password = parent.password,
                parentRaidId = parent.id
            )
        )

        val participants = participantRepository.findByRaidIdOrderByCreatedAtAsc(parent.id!!)
        participants.forEach { origin ->
            val copy = DnfParticipantEntity(
                raid = clone,
                character = origin.character,
                damage = origin.damage,
                buffPower = origin.buffPower,
                partyNumber = origin.partyNumber,
                slotIndex = origin.slotIndex
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

        val clonedParticipants = participantRepository.findByRaidIdOrderByCreatedAtAsc(clone.id!!)
        return toRaidDetailResponse(clone, clonedParticipants)
    }

    @Transactional(readOnly = true)
    fun getRaid(raidId: UUID): RaidDetailResponse {
        val raid = raidRepository.findById(raidId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.") }
        val participants = participantRepository.findByRaidIdOrderByCreatedAtAsc(raid.id!!)
        return toRaidDetailResponse(raid, participants)
    }

    @Transactional(readOnly = true)
    fun getLatestRaid(userId: String): RaidDetailResponse? {
        val latest = raidRepository.findFirstByUserIdOrderByCreatedAtDesc(userId) ?: return null
        val participants = participantRepository.findByRaidIdOrderByCreatedAtAsc(latest.id!!)
        return toRaidDetailResponse(latest, participants)
    }

    @Transactional
    fun addParticipant(raidId: UUID, request: AddParticipantRequest): ParticipantResponse {
        val raid = raidRepository.findById(raidId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.") }

        val character = characterService.getOrRefresh(request.serverId, request.characterId)

        val participant = participantRepository.save(
            DnfParticipantEntity(
                raid = raid,
                character = character,
                damage = request.damage ?: 0,
                buffPower = request.buffPower ?: 0,
                partyNumber = request.partyNumber,
                slotIndex = request.slotIndex
            )
        )

        statHistoryRepository.save(
            DnfStatHistoryEntity(
                participant = participant,
                damage = participant.damage,
                buffPower = participant.buffPower
            )
        )

        return toParticipantResponse(participant)
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
            parentRaidId = raid.parentRaidId,
            createdAt = raid.createdAt,
            participants = participants.map { toParticipantResponse(it) }
        )

    private fun toParticipantResponse(entity: DnfParticipantEntity): ParticipantResponse =
        ParticipantResponse(
            id = entity.id!!,
            raidId = entity.raid.id!!,
            damage = entity.damage,
            buffPower = entity.buffPower,
            partyNumber = entity.partyNumber,
            slotIndex = entity.slotIndex,
            character = characterService.toDto(entity.character),
            createdAt = entity.createdAt
        )
}
