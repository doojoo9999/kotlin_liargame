package org.example.dnf_raid.controller

import jakarta.validation.Valid
import org.example.dnf_raid.dto.DamageCalculationDetailDto
import org.example.dnf_raid.dto.DnfCalculatedDamageDto
import org.example.dnf_raid.dto.DnfCharacterLoadoutDto
import org.example.dnf_raid.dto.SyncLoadoutsRequest
import org.example.dnf_raid.service.DnfCharacterLoadoutService
import org.example.dnf_raid.service.DnfCharacterService
import org.example.dnf_raid.service.DnfDamageCalculationService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/dnf/characters")
class DnfCharacterLoadoutController(
    private val loadoutService: DnfCharacterLoadoutService,
    private val damageCalculationService: DnfDamageCalculationService,
    private val characterService: DnfCharacterService
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
            manualCharacters = request.manualCharacters,
            staleMinutes = request.staleMinutes
        )

    /**
     * 장착 정보를 바탕으로 딜/버프 점수를 계산하고 dnf_calculated_damages에 저장한다.
     * dnf_characters.damage 값은 건드리지 않는다(사용자 수동 입력 유지).
     */
    @PostMapping("/{serverId}/{characterId}/damage/calculate")
    fun calculateDamage(
        @PathVariable serverId: String,
        @PathVariable characterId: String
    ): DnfCalculatedDamageDto =
        damageCalculationService.calculateAndPersist(serverId, characterId)

    /**
     * 저장된 계산 결과(스킬별 딜 포함)를 조회한다. 부족할 경우 즉시 다시 계산한다.
     */
    @GetMapping("/{serverId}/{characterId}/damage/detail")
    fun getDamageDetail(
        @PathVariable serverId: String,
        @PathVariable characterId: String
    ): DamageCalculationDetailDto =
        characterService.getDamageDetail(serverId, characterId)

    /**
     * 등록된 캐릭터 전체(또는 limit 만큼) 딜/버프 점수 계산 후 저장.
     */
    @PostMapping("/damage/recalculate")
    fun recalculateForRegistered(
        @RequestParam(defaultValue = "21") updatedWithinDays: Long
    ): List<DnfCalculatedDamageDto> =
        damageCalculationService.calculateForRegistered(updatedWithinDays)
}
