package org.example.lineagew.presentation

import jakarta.validation.Valid
import org.example.lineagew.application.dto.FinalizeSaleRequest
import org.example.lineagew.application.dto.SaleCreateRequest
import org.example.lineagew.application.dto.SaleResponse
import org.example.lineagew.application.service.SaleService
import org.example.lineagew.common.SaleState
import org.example.lineagew.common.security.LineagewAdminOnly
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/lineage/sales")
@Validated
class SaleController(
    private val saleService: SaleService
) {

    @GetMapping
    fun listSales(@RequestParam(required = false) state: SaleState?): List<SaleResponse> =
        saleService.listSales(state)

    @GetMapping("/{id}")
    fun getSale(@PathVariable id: Long): SaleResponse = saleService.getSale(id)

    @LineagewAdminOnly
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createSale(@Valid @RequestBody request: SaleCreateRequest): SaleResponse =
        saleService.createSale(request)

    @LineagewAdminOnly
    @PutMapping("/{id}")
    fun updateSale(
        @PathVariable id: Long,
        @Valid @RequestBody request: SaleCreateRequest
    ): SaleResponse = saleService.updateSale(id, request)

    @LineagewAdminOnly
    @PostMapping("/{id}/finalize")
    fun finalizeSale(
        @PathVariable id: Long,
        @Valid @RequestBody request: FinalizeSaleRequest
    ): SaleResponse = saleService.finalizeSale(id, request)

    @LineagewAdminOnly
    @PostMapping("/{id}/cancel")
    fun cancelSale(@PathVariable id: Long): SaleResponse = saleService.cancelSale(id)
}
