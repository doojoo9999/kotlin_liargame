package org.example.dnf_raid.controller

import org.example.dnf_raid.dto.DnfCharacterLoadoutDto
import org.example.dnf_raid.service.DnfCharacterLoadoutService
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
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
}
