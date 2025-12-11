package org.example.dnf_raid.controller

import jakarta.validation.Valid
import org.example.dnf_raid.dto.DnfCharacterLoadoutDto
import org.example.dnf_raid.dto.SyncLoadoutsRequest
import org.example.dnf_raid.service.DnfCharacterLoadoutService
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/dnf/characters")
class DnfCharacterLoadoutController(
    private val loadoutService: DnfCharacterLoadoutService
) {

    /**
     * 캐릭터 장착 정보/버프 장비를 모두 수집해 DB에 캐시한다.
     */
    @PostMapping("/{serverId}/{characterId}/loadout")
    fun syncLoadout(
        @PathVariable serverId: String,
        @PathVariable characterId: String,
        @RequestParam(defaultValue = "20") timelineLimit: Int
    ): DnfCharacterLoadoutDto =
        loadoutService.refreshAndPersist(serverId, characterId, timelineLimit)

    /**
     * 등록된 캐릭터 전체 + 수동 입력 캐릭터들의 장착 정보를 한 번에 저장한다.
     */
    @PostMapping("/loadouts/sync")
    fun syncRegisteredAndManual(
        @Valid @RequestBody request: SyncLoadoutsRequest
    ): List<DnfCharacterLoadoutDto> =
        loadoutService.refreshRegisteredAndManual(
            includeRegistered = request.includeRegisteredCharacters,
            manualCharacters = request.manualCharacters
        )
}
