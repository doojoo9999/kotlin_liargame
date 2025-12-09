package org.example.dnf_raid.controller

import jakarta.validation.Valid
import org.example.dnf_raid.dto.*
import org.example.dnf_raid.service.DnfCharacterService
import org.example.dnf_raid.service.DnfRaidService
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@RestController
@RequestMapping("/api/dnf")
@Validated
class DnfRaidController(
    private val dnfRaidService: DnfRaidService,
    private val dnfCharacterService: DnfCharacterService
) {

    @GetMapping("/characters/search")
    fun searchCharacters(
        @RequestParam(required = false) characterName: String?,
        @RequestParam(required = false) adventureName: String?,
        @RequestParam(required = false) serverId: String?,
        @RequestParam(defaultValue = "20") limit: Int
    ): List<DnfCharacterDto> {
        val size = limit.coerceIn(1, 200)
        if (!characterName.isNullOrBlank()) {
            val server = serverId?.takeUnless { it.isBlank() }
                ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "serverId를 입력해주세요.")
            return dnfCharacterService.searchCharacters(server, characterName, size)
        }
        if (!adventureName.isNullOrBlank()) {
            return dnfCharacterService.searchByAdventureName(adventureName, size)
        }
        throw ResponseStatusException(HttpStatus.BAD_REQUEST, "characterName 또는 adventureName을 입력해주세요.")
    }

    @PostMapping("/raids")
    @ResponseStatus(HttpStatus.CREATED)
    fun createRaid(@Valid @RequestBody request: CreateRaidRequest): RaidDetailResponse =
        dnfRaidService.createRaid(request)

    @GetMapping("/raids/group/{motherRaidId}")
    fun getRaidGroup(@PathVariable motherRaidId: UUID): RaidGroupResponse =
        dnfRaidService.getRaidGroup(motherRaidId)

    @PostMapping("/raids/group/{motherRaidId}/participants")
    @ResponseStatus(HttpStatus.CREATED)
    fun addParticipantByMother(
        @PathVariable motherRaidId: UUID,
        @Valid @RequestBody request: AddParticipantRequest
    ): ParticipantResponse =
        dnfRaidService.addParticipantByMother(motherRaidId, request)

    @PostMapping("/raids/group/{motherRaidId}/participants/bulk")
    fun addParticipantsByMother(
        @PathVariable motherRaidId: UUID,
        @Valid @RequestBody request: AddParticipantBatchRequest
    ): RaidDetailResponse =
        dnfRaidService.addParticipantsByMother(motherRaidId, request)

    @PostMapping("/raids/{raidId}/clone")
    fun cloneRaid(
        @PathVariable raidId: UUID,
        @RequestBody(required = false) request: CloneRaidRequest?
    ): RaidDetailResponse =
        dnfRaidService.cloneRaid(raidId, request ?: CloneRaidRequest())

    @GetMapping("/raids/{raidId}")
    fun getRaid(@PathVariable raidId: UUID): RaidDetailResponse =
        dnfRaidService.getRaid(raidId)

    @GetMapping("/raids/latest")
    fun getLatestRaid(@RequestParam userId: String): RaidDetailResponse =
        dnfRaidService.getLatestRaid(userId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "최근 레이드가 없습니다.")

    @GetMapping("/raids/recent")
    fun getRecentRaids(
        @RequestParam userId: String,
        @RequestParam(required = false) limit: Int?
    ): List<RaidSummaryResponse> = dnfRaidService.getRecentRaids(userId, limit)

    @GetMapping("/raids/search")
    fun searchRaids(
        @RequestParam name: String,
        @RequestParam(required = false) limit: Int?
    ): List<RaidSummaryResponse> = dnfRaidService.searchRaidsByName(name, limit)

    @PostMapping("/raids/{raidId}/participants")
    @ResponseStatus(HttpStatus.CREATED)
    fun addParticipant(
        @PathVariable raidId: UUID,
        @Valid @RequestBody request: AddParticipantRequest
    ): ParticipantResponse =
        dnfRaidService.addParticipant(raidId, request)

    @PostMapping("/raids/{raidId}/participants/bulk")
    fun addParticipantsBulk(
        @PathVariable raidId: UUID,
        @Valid @RequestBody request: AddParticipantBatchRequest
    ): RaidDetailResponse =
        dnfRaidService.addParticipants(raidId, request)

    @PostMapping("/characters/register")
    fun registerCharacter(@Valid @RequestBody request: RegisterCharacterRequest): DnfCharacterDto =
        dnfRaidService.registerCharacter(request)

    @DeleteMapping("/raids/{raidId}/participants/by-adventure")
    fun deleteParticipantsByAdventure(
        @PathVariable raidId: UUID,
        @RequestParam(required = false) adventureName: String?
    ): RaidDetailResponse =
        dnfRaidService.deleteParticipantsByAdventure(raidId, adventureName)

    @PatchMapping("/raids/{raidId}/visibility")
    fun updateRaidVisibility(
        @PathVariable raidId: UUID,
        @Valid @RequestBody request: UpdateRaidVisibilityRequest
    ): RaidDetailResponse =
        dnfRaidService.updateRaidVisibility(raidId, request)

    @PatchMapping("/raids/{raidId}/participants/{participantId}")
    fun updateParticipant(
        @PathVariable raidId: UUID,
        @PathVariable participantId: UUID,
        @Valid @RequestBody request: UpdateParticipantRequest
    ): ParticipantResponse =
        dnfRaidService.updateParticipant(raidId, participantId, request)

    @DeleteMapping("/raids/{raidId}/participants/{participantId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteParticipant(
        @PathVariable raidId: UUID,
        @PathVariable participantId: UUID
    ) {
        dnfRaidService.deleteParticipant(raidId, participantId)
    }

    @GetMapping("/raids/{raidId}/participants/{participantId}/history")
    fun getStatHistory(
        @PathVariable raidId: UUID,
        @PathVariable participantId: UUID
    ): StatHistoryResponse {
        // raidId는 현재 readOnly라 단순히 일치하지 않아도 히스토리를 보여준다.
        return dnfRaidService.getStatHistory(participantId)
    }

    @GetMapping("/raids/{raidId}/share")
    fun getShareView(@PathVariable raidId: UUID): RaidDetailResponse =
        dnfRaidService.getRaid(raidId)

    @PostMapping("/raids/auto-fill")
    fun autoFill(@Valid @RequestBody request: AutoFillRequest): AutoFillResponse =
        dnfRaidService.autoFill(request)

    @PostMapping("/raids/auto-fill/keep-placed")
    fun autoFillKeepPlaced(@Valid @RequestBody request: AutoFillRequest): AutoFillResponse =
        dnfRaidService.autoFillKeepPlaced(request)

    @PostMapping("/raids/auto-fill/updong")
    fun updongAutoFill(@Valid @RequestBody request: UpdongAutoFillRequest): UpdongAutoFillResponse =
        dnfRaidService.updongAutoFill(request)
}
