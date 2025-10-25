package org.example.lineagew.presentation

import jakarta.validation.Valid
import org.example.lineagew.application.dto.BossKillCreateRequest
import org.example.lineagew.application.dto.BossKillResponse
import org.example.lineagew.application.service.BossKillService
import org.example.lineagew.common.security.LineagewAdminOnly
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/lineage/boss-kills")
@Validated
class BossKillController(
    private val bossKillService: BossKillService
) {

    @GetMapping
    fun listRecent(@RequestParam(defaultValue = "50") limit: Int): List<BossKillResponse> =
        bossKillService.findRecent(limit)

    @LineagewAdminOnly
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createBossKill(@Valid @RequestBody request: BossKillCreateRequest): BossKillResponse =
        bossKillService.createBossKill(request)
}
