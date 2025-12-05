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
        @RequestParam characterName: String,
        @RequestParam(defaultValue = "20") limit: Int
    ): List<DnfCharacterDto> =
        dnfCharacterService.searchCharacters(characterName, limit.coerceIn(1, 200))

    @PostMapping("/raids")
    @ResponseStatus(HttpStatus.CREATED)
    fun createRaid(@Valid @RequestBody request: CreateRaidRequest): RaidDetailResponse =
        dnfRaidService.createRaid(request)

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

    @PostMapping("/raids/{raidId}/participants")
    @ResponseStatus(HttpStatus.CREATED)
    fun addParticipant(
        @PathVariable raidId: UUID,
        @Valid @RequestBody request: AddParticipantRequest
    ): ParticipantResponse =
        dnfRaidService.addParticipant(raidId, request)

    @PatchMapping("/raids/{raidId}/participants/{participantId}")
    fun updateParticipant(
        @PathVariable raidId: UUID,
        @PathVariable participantId: UUID,
        @Valid @RequestBody request: UpdateParticipantRequest
    ): ParticipantResponse =
        dnfRaidService.updateParticipant(raidId, participantId, request)

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
}
