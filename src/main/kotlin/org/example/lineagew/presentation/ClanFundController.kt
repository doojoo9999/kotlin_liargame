package org.example.lineagew.presentation

import jakarta.validation.Valid
import org.example.lineagew.application.dto.ClanFundResponse
import org.example.lineagew.application.dto.ClanFundTxnRequest
import org.example.lineagew.application.dto.ClanFundTxnResponse
import org.example.lineagew.application.service.ClanFundService
import org.example.lineagew.common.security.LineagewAdminOnly
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/lineage/clan-fund")
@Validated
class ClanFundController(
    private val clanFundService: ClanFundService
) {

    @GetMapping
    fun getFund(): ClanFundResponse = clanFundService.getSummary()

    @LineagewAdminOnly
    @PostMapping("/transactions")
    @ResponseStatus(HttpStatus.CREATED)
    fun createTransaction(@Valid @RequestBody request: ClanFundTxnRequest): ClanFundTxnResponse =
        clanFundService.recordTransaction(request)
}
