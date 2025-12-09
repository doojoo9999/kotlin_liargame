package org.example.dnf_raid.service

import org.example.dnf_raid.dto.*
import org.example.dnf_raid.model.CohortPreference
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
import kotlin.math.max
import kotlin.math.roundToLong
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

    @Transactional
    fun autoFill(request: AutoFillRequest): AutoFillResponse = performAutoFill(request, keepPlaced = false)

    @Transactional
    fun autoFillKeepPlaced(request: AutoFillRequest): AutoFillResponse = performAutoFill(request, keepPlaced = true)

    @Transactional
    fun updongAutoFill(request: UpdongAutoFillRequest): UpdongAutoFillResponse {
        val raidIds = request.raidIds.distinct()
        if (raidIds.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "레이드를 먼저 선택하세요.")
        }

        val raids = raidRepository.findAllById(raidIds)
        if (raids.size != raidIds.size) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.")
        }

        val raidMap = raids.associateBy { it.id!! }
        val partyCount = request.partyCount.coerceAtLeast(1)
        val slotsPerParty = request.slotsPerParty.coerceAtLeast(1)

        val raidDetails = raidIds.map { id ->
            val raid = raidMap[id] ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.")
            raid to loadUniqueParticipants(id)
        }

        val touchedRaidIds = mutableSetOf<UUID>()
        var totalAssigned = 0
        var totalMissing = 0

        val slotPattern: Map<Int, List<String>> = mapOf(
            1 to listOf("B", "U", "U", "D"),
            2 to listOf("U", "B", "D", "U"),
            3 to listOf("U", "D", "B", "U"),
            4 to listOf("D", "U", "U", "B")
        )

        for (start in raidDetails.indices step 4) {
            val slice = raidDetails.subList(start, minOf(start + 4, raidDetails.size))
            if (slice.isEmpty()) continue

            val pool = slice.flatMap { it.second }
            if (pool.isEmpty()) {
                totalMissing += slice.size * partyCount * slotsPerParty
                continue
            }

            val topBuffers = selectTopBuffers(pool, partyCount)
            val bufferAdventureKeys = topBuffers.map { adventureKey(it) }.toSet()
            val topDealers = selectTopDealers(pool, partyCount, bufferAdventureKeys)
            val dealerAdventureKeys = topDealers.map { adventureKey(it) }.toSet()

            val updongPool = pool
                .filter { key ->
                    val adv = adventureKey(key)
                    !bufferAdventureKeys.contains(adv) && !dealerAdventureKeys.contains(adv)
                }
                .sortedByDescending { scoreUpdong(it) }
                .toMutableList()

            var updongIndex = 0
            val sliceUsedChars = mutableSetOf<String>()
            slice.forEach { (_, participants) ->
                participants.filter { it.partyNumber != null && it.slotIndex != null }
                    .forEach { p -> sliceUsedChars.add(characterKey(p)) }
            }

            slice.forEach { (raid, participants) ->
                val raidId = raid.id ?: return@forEach
                touchedRaidIds.add(raidId)

                val occupied = mutableMapOf<Int, MutableMap<Int, DnfParticipantEntity>>()
                val usedAdventureKeys = mutableSetOf<String>()

                (1..partyCount).forEach { partyNumber ->
                    occupied[partyNumber] = mutableMapOf()
                }

                participants.forEach { participant ->
                    val partyNumber = participant.partyNumber
                    val slotIndex = participant.slotIndex
                    if (partyNumber != null && slotIndex != null) {
                        usedAdventureKeys.add(adventureKey(participant))
                        occupied[partyNumber]?.set(slotIndex, participant)
                    }
                }

                fun pickBestFromList(list: List<DnfParticipantEntity>): DnfParticipantEntity? =
                    list.firstOrNull { candidate ->
                        val charKey = characterKey(candidate)
                        val advKey = adventureKey(candidate)
                        !sliceUsedChars.contains(charKey) && !usedAdventureKeys.contains(advKey)
                    }

                fun ensureParticipantInRaid(candidate: DnfParticipantEntity, partyNumber: Int, slotIndex: Int): Boolean {
                    val charKey = characterKey(candidate)
                    val advKey = adventureKey(candidate)
                    if (sliceUsedChars.contains(charKey) || usedAdventureKeys.contains(advKey)) return false

                    val existing = participants.firstOrNull { characterKey(it) == charKey }
                    if (existing != null) {
                        if (existing.partyNumber != null && existing.slotIndex != null) {
                            sliceUsedChars.add(charKey)
                            usedAdventureKeys.add(advKey)
                            return false
                        }
                        existing.partyNumber = partyNumber
                        existing.slotIndex = slotIndex
                        participantRepository.save(existing)
                        sliceUsedChars.add(charKey)
                        usedAdventureKeys.add(advKey)
                        totalAssigned += 1
                        return true
                    }

                    createParticipant(
                        raid,
                        AddParticipantRequest(
                            serverId = candidate.character.serverId,
                            characterId = candidate.character.characterId,
                            damage = candidate.damage,
                            buffPower = candidate.buffPower,
                            partyNumber = partyNumber,
                            slotIndex = slotIndex,
                            cohortPreference = candidate.cohortPreference
                        )
                    )
                    sliceUsedChars.add(charKey)
                    usedAdventureKeys.add(advKey)
                    totalAssigned += 1
                    return true
                }

                (1..partyCount).forEach { partyNumber ->
                    val pattern = (slotPattern[partyNumber] ?: slotPattern[1] ?: emptyList())
                        .take(slotsPerParty)
                    val partyOccupied = occupied[partyNumber] ?: mutableMapOf()

                    pattern.forEachIndexed { slotIndex, role ->
                        if (partyOccupied.containsKey(slotIndex)) return@forEachIndexed
                        when (role) {
                            "B" -> {
                                val candidate = pickBestFromList(topBuffers)
                                if (candidate == null) {
                                    totalMissing += 1
                                    return@forEachIndexed
                                }
                                ensureParticipantInRaid(candidate, partyNumber, slotIndex)
                            }

                            "D" -> {
                                val candidate = pickBestFromList(topDealers)
                                if (candidate == null) {
                                    totalMissing += 1
                                    return@forEachIndexed
                                }
                                ensureParticipantInRaid(candidate, partyNumber, slotIndex)
                            }

                            else -> {
                                var picked: DnfParticipantEntity? = null
                                while (updongIndex < updongPool.size && picked == null) {
                                    val candidate = updongPool[updongIndex]
                                    updongIndex += 1
                                    val charKey = characterKey(candidate)
                                    val advKey = adventureKey(candidate)
                                    if (sliceUsedChars.contains(charKey) || usedAdventureKeys.contains(advKey)) continue
                                    picked = candidate
                                }
                                if (picked == null) {
                                    totalMissing += 1
                                    return@forEachIndexed
                                }
                                ensureParticipantInRaid(picked, partyNumber, slotIndex)
                            }
                        }
                    }
                }
            }
        }

        val raidsToReturn = touchedRaidIds.map { id ->
            val raid = raidMap[id] ?: raidRepository.findById(id)
                .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.") }
            toRaidDetailResponse(raid, loadUniqueParticipants(id))
        }

        return UpdongAutoFillResponse(
            assignedCount = totalAssigned,
            missingCount = totalMissing,
            raids = raidsToReturn
        )
    }

    private fun performAutoFill(request: AutoFillRequest, keepPlaced: Boolean): AutoFillResponse {
        val raidIds = request.raidIds.distinct()
        if (raidIds.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "레이드를 먼저 선택하세요.")
        }

        val raids = raidRepository.findAllById(raidIds)
        if (raids.size != raidIds.size) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.")
        }

        val raidMap = raids.associateBy { it.id!! }
        val partyCount = request.partyCount.coerceAtLeast(1)
        val slotsPerParty = request.slotsPerParty.coerceAtLeast(1)
        val overallUsed = mutableSetOf<UUID>()
        val globalUsedCharacters = mutableSetOf<String>()
        val adventureBuckets = linkedMapOf<String, MutableMap<String, DnfParticipantEntity>>()
        val statsSeenByCharacter = linkedMapOf<String, DnfParticipantEntity>()
        var totalDamage: Long = 0
        var totalBuff: Long = 0
        var totalCount = 0

        val raidStates = raidIds.map { id ->
            val raid = raidMap[id] ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.")
            val participants = loadUniqueParticipants(id)
            participants.forEach { participant ->
                val charKey = characterKey(participant)
                val existingStat = statsSeenByCharacter[charKey]
                if (existingStat == null || scoreParticipant(participant) > scoreParticipant(existingStat)) {
                    statsSeenByCharacter[charKey] = participant
                }

                val key = adventureKey(participant)
                val bucket = adventureBuckets.computeIfAbsent(key) { linkedMapOf() }
                val existing = bucket[charKey]
                if (existing == null || scoreParticipant(participant) > scoreParticipant(existing)) {
                    bucket[charKey] = participant
                }

                if (participant.partyNumber != null && participant.slotIndex != null) {
                    participant.id?.let { overallUsed.add(it) }
                    globalUsedCharacters.add(charKey)
                }
            }

            val assigned = participants.filter { it.partyNumber != null && it.slotIndex != null }.toMutableList()
            val used = assigned.map { adventureKey(it) }.toMutableSet()
            val capacity = (partyCount * slotsPerParty - assigned.size).coerceAtLeast(0)

            RaidState(
                raid = raid,
                participants = participants,
                assigned = assigned,
                used = used,
                capacity = capacity,
                planned = mutableListOf()
            )
        }

        statsSeenByCharacter.values.forEach { participant ->
            totalDamage += participant.damage
            totalBuff += participant.buffPower
            totalCount += 1
        }

        val hasUserTargets = !request.partyTargets.isNullOrEmpty()
        val defaultTargets = computeDefaultTargets(partyCount, totalDamage, totalBuff, totalCount, hasUserTargets)
        val targets = normalizeTargets(request.partyTargets, partyCount, defaultTargets)

        val totalApplicants = raidStates.sumOf { it.participants.size }
        if (totalApplicants == 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "배치할 신청자가 없습니다.")
        }

        val adventureEntries = adventureBuckets.entries
            .map { (advKey, bucket) ->
                advKey to bucket.values.sortedByDescending { scoreParticipant(it) }.toMutableList()
            }
            .sortedByDescending { (_, list) ->
                list.firstOrNull()?.let { scoreParticipant(it) } ?: Long.MIN_VALUE
            }

        val frontPath = buildSnakePath(raidStates.size, startFromBack = false)
        val backPath = buildSnakePath(raidStates.size, startFromBack = true)
        data class SnakeCursor(var idx: Int)
        val frontCursor = SnakeCursor(0)
        val backCursor = SnakeCursor(0)
        val neutralCursor = SnakeCursor(0)

        fun tryAssign(
            candidate: DnfParticipantEntity,
            path: List<Int>,
            cursor: SnakeCursor,
            adventureKey: String,
            charKey: String
        ): Boolean {
            if (path.isEmpty()) return false
            val limit = path.size
            for (step in 0 until limit) {
                val pos = path[cursor.idx % path.size]
                cursor.idx += 1
                val state = raidStates[pos]
                if (state.capacity <= 0) continue
                if (state.used.contains(adventureKey)) continue
                if (globalUsedCharacters.contains(charKey)) continue
                state.planned.add(candidate)
                state.used.add(adventureKey)
                state.capacity -= 1
                candidate.id?.let { overallUsed.add(it) }
                globalUsedCharacters.add(charKey)
                return true
            }
            return false
        }

        adventureEntries.forEach { (adventureKey, queue) ->
            val mutableQueue = queue.toMutableList()
            while (mutableQueue.isNotEmpty()) {
                var candidate: DnfParticipantEntity? = null
                while (mutableQueue.isNotEmpty() && candidate == null) {
                    val next = mutableQueue.removeAt(0)
                    val id = next.id
                    if (id != null && overallUsed.contains(id)) continue
                    val charKey = characterKey(next)
                    if (globalUsedCharacters.contains(charKey)) continue
                    candidate = next
                }
                if (candidate == null) break

                val charKey = characterKey(candidate)
                val placed = when (candidate.cohortPreference) {
                    CohortPreference.FRONT -> tryAssign(candidate, frontPath, frontCursor, adventureKey, charKey)
                    CohortPreference.BACK -> tryAssign(candidate, backPath, backCursor, adventureKey, charKey)
                    else -> {
                        val primary = tryAssign(candidate, frontPath, neutralCursor, adventureKey, charKey)
                        if (primary) true else tryAssign(candidate, backPath, neutralCursor, adventureKey, charKey)
                    }
                }

                if (!placed) break
            }
        }

        val touchedRaidIds = mutableSetOf<UUID>()
        val results = mutableListOf<AutoFillRaidResult>()

        raidStates.forEachIndexed { idx, state ->
            val raidId = state.raid.id ?: return@forEachIndexed
            touchedRaidIds.add(raidId)
            val result = if (keepPlaced) {
                applyFillEmptyForRaid(state, targets, partyCount, slotsPerParty, touchedRaidIds)
            } else {
                applyAutoAssignForRaid(state, targets, partyCount, slotsPerParty, touchedRaidIds)
            }

            val labelName = state.raid.name.ifBlank { "${idx + 1}기" }
            results.add(
                AutoFillRaidResult(
                    raidId = result.raidId,
                    name = labelName,
                    usedCount = result.usedCount,
                    duplicateAdventureCount = result.duplicateAdventureCount,
                    unplacedCount = result.unplacedCount
                )
            )
        }

        val raidsToReturn = touchedRaidIds.map { id ->
            val raid = raidMap[id] ?: raidRepository.findById(id)
                .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.") }
            toRaidDetailResponse(raid, loadUniqueParticipants(id))
        }

        return AutoFillResponse(results = results, raids = raidsToReturn)
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

    private fun buildSnakePath(size: Int, startFromBack: Boolean): List<Int> {
        if (size <= 0) return emptyList()
        if (size == 1) return listOf(0)
        return if (!startFromBack) {
            (0 until size).toList() + (size - 2 downTo 1).toList()
        } else {
            (size - 1 downTo 0).toList() + (1 until size - 1).toList()
        }
    }

    private data class RaidState(
        val raid: DnfRaidEntity,
        val participants: List<DnfParticipantEntity>,
        val assigned: MutableList<DnfParticipantEntity>,
        val used: MutableSet<String>,
        var capacity: Int,
        val planned: MutableList<DnfParticipantEntity>
    )

    private fun adventureKey(participant: DnfParticipantEntity): String {
        val raw = participant.character.adventureName?.trim()?.lowercase()
        return if (!raw.isNullOrBlank()) "adv:$raw" else "char:${participant.character.characterId}"
    }

    private fun characterKey(participant: DnfParticipantEntity): String =
        "${participant.character.serverId}:${participant.character.characterId}"

    private fun scoreParticipant(participant: DnfParticipantEntity): Long =
        participant.damage + participant.buffPower * 8

    private fun scoreUpdong(participant: DnfParticipantEntity): Long =
        participant.damage + (participant.buffPower * 5) / 10

    private fun selectTopBuffers(list: List<DnfParticipantEntity>, count: Int): List<DnfParticipantEntity> =
        list.sortedWith(compareByDescending<DnfParticipantEntity> { it.buffPower }.thenByDescending { it.damage })
            .take(count)

    private fun selectTopDealers(
        list: List<DnfParticipantEntity>,
        count: Int,
        excludedAdventureKeys: Set<String>
    ): List<DnfParticipantEntity> =
        list
            .filter { !excludedAdventureKeys.contains(adventureKey(it)) }
            .sortedWith(compareByDescending<DnfParticipantEntity> { it.damage }.thenByDescending { it.buffPower })
            .take(count)

    private data class PartyTarget(val damageTarget: Long, val buffTarget: Long)

    private fun computeDefaultTargets(
        partyCount: Int,
        totalDamage: Long,
        totalBuff: Long,
        totalCount: Int,
        hasUserTargets: Boolean
    ): List<PartyTarget> {
        if (partyCount <= 0) return emptyList()
        if (totalCount <= 0) return List(partyCount) { PartyTarget(1, 1) }

        val baseDamageAvg = totalDamage.toDouble() / totalCount.toDouble()
        val baseBuffAvg = totalBuff.toDouble() / totalCount.toDouble()

        return (0 until partyCount).map { idx ->
            val damageScale = if (hasUserTargets) 1.0 else if (idx == 0) 1.1 else 0.95
            val buffScale = if (hasUserTargets) 1.0 else if (idx == 0) 1.05 else 0.95

            val damage = max(1L, (baseDamageAvg * damageScale).roundToLong())
            val buff = max(1L, (baseBuffAvg * buffScale).roundToLong())
            PartyTarget(damage, buff)
        }
    }

    private fun normalizeTargets(
        targets: List<PartyTargetRequest>?,
        partyCount: Int,
        defaultTargets: List<PartyTarget>
    ): List<PartyTarget> {
        val safeDefaults = if (defaultTargets.isNotEmpty()) defaultTargets else List(partyCount) { PartyTarget(1, 1) }
        val fallback = safeDefaults.firstOrNull() ?: PartyTarget(1, 1)

        return (0 until partyCount).map { idx ->
            val target = targets?.getOrNull(idx)
            if (target != null) {
                val damage = if (target.damageTarget > 0) target.damageTarget else 1
                val buff = if (target.buffTarget > 0) target.buffTarget else 1
                PartyTarget(damage, buff)
            } else {
                safeDefaults.getOrElse(idx) { fallback }
            }
        }
    }

    private data class AssignmentResult(
        val raidId: UUID,
        val usedCount: Int,
        val duplicateAdventureCount: Int,
        val unplacedCount: Int
    )

    private data class ParticipantAssignment(val participantId: UUID, val partyNumber: Int?, val slotIndex: Int?)

    private data class AutoAssignComputationResult(
        val assignments: List<ParticipantAssignment>,
        val usedCount: Int,
        val duplicateAdventureCount: Int,
        val unplacedCount: Int
    )

    private fun applyAutoAssignForRaid(
        state: RaidState,
        targets: List<PartyTarget>,
        partyCount: Int,
        slotsPerParty: Int,
        touchedRaidIds: MutableSet<UUID>
    ): AssignmentResult {
        val raidState = state
        val raidId = raidState.raid.id ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.")
        touchedRaidIds.add(raidId)

        val picks = mutableListOf<DnfParticipantEntity>()
        picks.addAll(raidState.assigned)

        raidState.planned.forEach { planned ->
            val plannedRaidId = planned.raid.id
            if (plannedRaidId == raidId) {
                picks.add(planned)
                return@forEach
            }

            val cloned = createParticipant(
                raidState.raid,
                AddParticipantRequest(
                    serverId = planned.character.serverId,
                    characterId = planned.character.characterId,
                    damage = planned.damage,
                    buffPower = planned.buffPower,
                    cohortPreference = planned.cohortPreference
                )
            )
            picks.add(cloned)

            if (plannedRaidId != null) {
                touchedRaidIds.add(plannedRaidId)
                deleteParticipantInternal(planned)
            }
        }

        val result = autoAssignParticipantsInternal(picks, partyCount, slotsPerParty, targets)

        val participantMap = picks.associateBy { it.id }
        result.assignments.forEach { assignment ->
            val participant = participantMap[assignment.participantId] ?: return@forEach
            if (participant.partyNumber != assignment.partyNumber || participant.slotIndex != assignment.slotIndex) {
                participant.partyNumber = assignment.partyNumber
                participant.slotIndex = assignment.slotIndex
                participantRepository.save(participant)
            }
        }

        return AssignmentResult(
            raidId = raidId,
            usedCount = result.usedCount,
            duplicateAdventureCount = result.duplicateAdventureCount,
            unplacedCount = result.unplacedCount
        )
    }

    private fun applyFillEmptyForRaid(
        state: RaidState,
        targets: List<PartyTarget>,
        partyCount: Int,
        slotsPerParty: Int,
        touchedRaidIds: MutableSet<UUID>
    ): AssignmentResult {
        val raidState = state
        val raidId = raidState.raid.id ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "레이드를 찾을 수 없습니다.")
        touchedRaidIds.add(raidId)

        val locked = raidState.participants.filter { it.partyNumber != null && it.slotIndex != null }

        val occupied = mutableMapOf<Int, MutableSet<Int>>()
        (1..partyCount).forEach { partyNumber ->
            occupied[partyNumber] = mutableSetOf()
        }
        locked.forEach { participant ->
            val partyNumber = participant.partyNumber
            val slotIndex = participant.slotIndex
            if (partyNumber != null && slotIndex != null) {
                occupied[partyNumber]?.add(slotIndex)
            }
        }

        val usedAdventureKeys = raidState.used.toMutableSet()

        val plannedCandidates = mutableListOf<DnfParticipantEntity>()
        raidState.planned.forEach { planned ->
            val plannedRaidId = planned.raid.id
            if (plannedRaidId == raidId) {
                plannedCandidates.add(planned)
                return@forEach
            }
            val cloned = createParticipant(
                raidState.raid,
                AddParticipantRequest(
                    serverId = planned.character.serverId,
                    characterId = planned.character.characterId,
                    damage = planned.damage,
                    buffPower = planned.buffPower,
                    cohortPreference = planned.cohortPreference
                )
            )
            plannedCandidates.add(cloned)
            if (plannedRaidId != null) {
                touchedRaidIds.add(plannedRaidId)
                deleteParticipantInternal(planned)
            }
        }

        val localUnassigned = raidState.participants.filter { it.partyNumber == null || it.slotIndex == null }
        val candidates = localUnassigned + plannedCandidates

        data class PartyState(
            val partyNumber: Int,
            val members: MutableList<DnfParticipantEntity>,
            var sumDamage: Long,
            var sumBuff: Long,
            val target: PartyTarget
        )

        val parties = (0 until partyCount).map { idx ->
            val partyNumber = idx + 1
            val members = locked.filter { it.partyNumber == partyNumber }.toMutableList()
            val sumDamage = members.sumOf { it.damage }
            val sumBuff = members.sumOf { it.buffPower }
            PartyState(partyNumber, members, sumDamage, sumBuff, targets[idx])
        }

        fun evaluateFit(party: PartyState, participant: DnfParticipantEntity): Double {
            val nextCount = party.members.size + 1
            val nextDamageAvg = (party.sumDamage + participant.damage).toDouble() / nextCount
            val nextBuffAvg = (party.sumBuff + participant.buffPower).toDouble() / nextCount
            val targetDamage = maxOf(party.target.damageTarget, 1)
            val targetBuff = maxOf(party.target.buffTarget, 1)
            val damageDiff = kotlin.math.abs(nextDamageAvg - targetDamage) / targetDamage
            val buffDiff = kotlin.math.abs(nextBuffAvg - targetBuff) / targetBuff
            val loadPenalty = party.members.size.toDouble() / slotsPerParty
            return damageDiff + buffDiff + loadPenalty * 0.1
        }

        fun findNextSlotIndex(occupiedSet: Set<Int>): Int {
            for (i in 0 until slotsPerParty) {
                if (!occupiedSet.contains(i)) return i
            }
            return slotsPerParty
        }

        val assignments = mutableListOf<ParticipantAssignment>()

        candidates.forEach { candidate ->
            val advKey = adventureKey(candidate)
            if (usedAdventureKeys.contains(advKey)) return@forEach

            var bestParty: PartyState? = null
            var bestScore = Double.POSITIVE_INFINITY

            parties.forEach { party ->
                val partyOccupied = occupied[party.partyNumber] ?: emptySet()
                if (partyOccupied.size >= slotsPerParty) return@forEach
                val fit = evaluateFit(party, candidate)
                if (fit < bestScore - 1e-6 || (kotlin.math.abs(fit - bestScore) < 1e-6 && party.members.size < (bestParty?.members?.size ?: Int.MAX_VALUE))) {
                    bestParty = party
                    bestScore = fit
                }
            }

            val chosen = bestParty ?: return@forEach
            val partyOccupied = occupied[chosen.partyNumber] ?: mutableSetOf()
            val slotIndex = findNextSlotIndex(partyOccupied)
            partyOccupied.add(slotIndex)
            occupied[chosen.partyNumber] = partyOccupied
            chosen.members.add(candidate)
            chosen.sumDamage += candidate.damage
            chosen.sumBuff += candidate.buffPower
            usedAdventureKeys.add(advKey)
            val candidateId = candidate.id ?: return@forEach
            assignments.add(ParticipantAssignment(candidateId, chosen.partyNumber, slotIndex))
        }

        assignments.forEach { assignment ->
            val participant = candidates.firstOrNull { it.id == assignment.participantId }
                ?: return@forEach
            if (participant.partyNumber != assignment.partyNumber || participant.slotIndex != assignment.slotIndex) {
                participant.partyNumber = assignment.partyNumber
                participant.slotIndex = assignment.slotIndex
                participantRepository.save(participant)
            }
        }

        val usedCount = locked.size + assignments.size
        val unplacedCount = locked.size + candidates.size - usedCount

        return AssignmentResult(
            raidId = raidId,
            usedCount = usedCount,
            duplicateAdventureCount = 0,
            unplacedCount = unplacedCount
        )
    }

    private fun autoAssignParticipantsInternal(
        participants: List<DnfParticipantEntity>,
        partyCount: Int,
        slotsPerParty: Int,
        targets: List<PartyTarget>
    ): AutoAssignComputationResult {
        if (partyCount <= 0 || slotsPerParty <= 0 || participants.isEmpty()) {
            return AutoAssignComputationResult(
                assignments = participants.mapNotNull { p -> p.id?.let { ParticipantAssignment(it, null, null) } },
                usedCount = 0,
                duplicateAdventureCount = 0,
                unplacedCount = participants.size
            )
        }

        val adventureMap = linkedMapOf<String, DnfParticipantEntity>()
        var duplicateAdventureCount = 0

        participants.forEach { participant ->
            val key = adventureKey(participant)
            val existing = adventureMap[key]
            if (existing == null) {
                adventureMap[key] = participant
            } else {
                val better = if (scoreParticipant(existing) >= scoreParticipant(participant)) existing else participant
                if (better != existing) {
                    duplicateAdventureCount += 1
                    adventureMap[key] = better
                } else {
                    duplicateAdventureCount += 1
                }
            }
        }

        val uniqueParticipants = adventureMap.values.toList()

        data class PartyState(
            val partyNumber: Int,
            val members: MutableList<DnfParticipantEntity>,
            var sumDamage: Long,
            var sumBuff: Long,
            val target: PartyTarget
        )

        val parties = (0 until partyCount).map { idx ->
            PartyState(
                partyNumber = idx + 1,
                members = mutableListOf(),
                sumDamage = 0,
                sumBuff = 0,
                target = targets[idx]
            )
        }

        val usedIds = mutableSetOf<UUID>()

        val bufferCandidates = uniqueParticipants
            .filter { it.buffPower > 0 }
            .sortedWith(compareByDescending<DnfParticipantEntity> { it.buffPower }.thenByDescending { scoreParticipant(it) })

        parties.forEach { party ->
            if (party.members.size >= slotsPerParty) return@forEach
            val buffer = bufferCandidates.firstOrNull { candidate -> candidate.id != null && !usedIds.contains(candidate.id) }
            if (buffer != null) {
                party.members.add(buffer)
                party.sumDamage += buffer.damage
                party.sumBuff += buffer.buffPower
                buffer.id?.let { usedIds.add(it) }
            }
        }

        val remainingCandidates = uniqueParticipants
            .filter { it.id == null || !usedIds.contains(it.id!!) }
            .sortedByDescending { scoreParticipant(it) }

        fun evaluateFit(party: PartyState, participant: DnfParticipantEntity): Double {
            val nextCount = party.members.size + 1
            val nextDamageAvg = (party.sumDamage + participant.damage).toDouble() / nextCount
            val nextBuffAvg = (party.sumBuff + participant.buffPower).toDouble() / nextCount
            val targetDamage = maxOf(party.target.damageTarget, 1)
            val targetBuff = maxOf(party.target.buffTarget, 1)
            val damageDiff = kotlin.math.abs(nextDamageAvg - targetDamage) / targetDamage
            val buffDiff = kotlin.math.abs(nextBuffAvg - targetBuff) / targetBuff
            val loadPenalty = party.members.size.toDouble() / slotsPerParty
            return damageDiff + buffDiff + loadPenalty * 0.1
        }

        remainingCandidates.forEach { candidate ->
            var bestParty: PartyState? = null
            var bestScore = Double.POSITIVE_INFINITY

            parties.forEach { party ->
                if (party.members.size >= slotsPerParty) return@forEach
                val fit = evaluateFit(party, candidate)
                if (fit < bestScore - 1e-6 || (kotlin.math.abs(fit - bestScore) < 1e-6 && party.members.size < (bestParty?.members?.size ?: Int.MAX_VALUE))) {
                    bestParty = party
                    bestScore = fit
                }
            }

            val chosen = bestParty ?: return@forEach
            chosen.members.add(candidate)
            chosen.sumDamage += candidate.damage
            chosen.sumBuff += candidate.buffPower
            candidate.id?.let { usedIds.add(it) }
        }

        val assignmentMap = mutableMapOf<UUID, ParticipantAssignment>()

        parties.forEach { party ->
            party.members.forEachIndexed { idx, member ->
                member.id?.let { assignmentMap[it] = ParticipantAssignment(it, party.partyNumber, idx) }
            }
        }

        participants.forEach { participant ->
            val id = participant.id ?: return@forEach
            assignmentMap.putIfAbsent(id, ParticipantAssignment(id, null, null))
        }

        val assignments = participants.mapNotNull { it.id?.let { id -> assignmentMap[id] } }
        val usedCount = assignments.count { it.partyNumber != null }
        val unplacedCount = participants.size - usedCount

        return AutoAssignComputationResult(
            assignments = assignments,
            usedCount = usedCount,
            duplicateAdventureCount = duplicateAdventureCount,
            unplacedCount = unplacedCount
        )
    }

    private fun deleteParticipantInternal(participant: DnfParticipantEntity) {
        val participantId = participant.id ?: return
        statHistoryRepository.deleteByParticipantId(participantId)
        participantRepository.delete(participant)
    }

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
        val damage = request.damage ?: character.damage
        val buffPower = request.buffPower ?: character.buffPower

        val updatedCharacter = characterService.applyStats(character, damage, buffPower)

        // 기존 동일 캐릭터 신청 제거 후 최신 신청만 유지
        participantRepository.deleteByRaidIdAndCharacterId(raid.id!!, updatedCharacter.characterId)

        val participant = participantRepository.save(
            DnfParticipantEntity(
                raid = raid,
                character = updatedCharacter,
                damage = damage,
                buffPower = buffPower,
                partyNumber = request.partyNumber,
                slotIndex = request.slotIndex,
                cohortPreference = request.cohortPreference
            )
        )

        statHistoryRepository.save(
            DnfStatHistoryEntity(
                participant = participant,
                damage = damage,
                buffPower = buffPower
            )
        )

        return participant
    }
}
