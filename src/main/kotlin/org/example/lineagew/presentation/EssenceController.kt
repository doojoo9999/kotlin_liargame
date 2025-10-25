package org.example.lineagew.presentation

import jakarta.validation.Valid
import org.example.lineagew.application.dto.EssenceRequest
import org.example.lineagew.application.dto.EssenceResponse
import org.example.lineagew.application.dto.EssenceTxnRequest
import org.example.lineagew.application.service.EssenceService
import org.example.lineagew.common.security.LineagewAdminOnly
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/lineage/essences")
@Validated
class EssenceController(
    private val essenceService: EssenceService
) {

    @GetMapping
    fun listEssences(): List<EssenceResponse> = essenceService.listEssences()

    @LineagewAdminOnly
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun upsert(@Valid @RequestBody request: EssenceRequest): EssenceResponse =
        essenceService.upsertEssence(request)

    @LineagewAdminOnly
    @PostMapping("/{id}/transactions")
    fun appendTxn(
        @PathVariable id: Long,
        @Valid @RequestBody request: EssenceTxnRequest
    ): EssenceResponse = essenceService.appendTransaction(id, request)
}
