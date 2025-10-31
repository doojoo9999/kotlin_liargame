package org.example.lineagew.presentation

import org.example.lineagew.application.dto.PayoutDetailResponse
import org.example.lineagew.application.dto.PayoutStatusUpdateRequest
import org.example.lineagew.application.service.PayoutSearchCriteria
import org.example.lineagew.application.service.PayoutService
import org.example.lineagew.common.PayoutStatus
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@RestController
@RequestMapping("/api/lineage/payouts")
class PayoutController(
    private val payoutService: PayoutService
) {

    @GetMapping
    fun listPayouts(
        @RequestParam(required = false) status: PayoutStatus?,
        @RequestParam(required = false) memberId: Long?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
        @RequestParam(required = false) limit: Int?
    ): List<PayoutDetailResponse> {
        val criteria = PayoutSearchCriteria(
            status = status,
            memberId = memberId,
            from = from?.atStartOfDay(),
            to = to?.let { LocalDateTime.of(it, LocalTime.MAX) },
            limit = limit
        )
        return payoutService.search(criteria)
    }

    @PutMapping("/{payoutId}/status")
    fun updateStatus(
        @PathVariable payoutId: Long,
        @RequestBody request: PayoutStatusUpdateRequest
    ): PayoutDetailResponse = payoutService.updateStatus(payoutId, request)
}
