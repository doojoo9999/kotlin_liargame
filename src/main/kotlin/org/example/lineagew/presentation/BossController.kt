package org.example.lineagew.presentation

import jakarta.validation.Valid
import org.example.lineagew.application.dto.BossRequest
import org.example.lineagew.application.dto.BossResponse
import org.example.lineagew.application.service.BossService
import org.example.lineagew.common.security.LineagewAdminOnly
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/lineage/bosses")
@Validated
class BossController(
    private val bossService: BossService
) {

    @GetMapping
    fun listBosses(): List<BossResponse> = bossService.getBosses()

    @LineagewAdminOnly
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createBoss(@Valid @RequestBody request: BossRequest): BossResponse = bossService.createBoss(request)

    @LineagewAdminOnly
    @PutMapping("/{id}")
    fun updateBoss(
        @PathVariable id: Long,
        @Valid @RequestBody request: BossRequest
    ): BossResponse = bossService.updateBoss(id, request)
}
