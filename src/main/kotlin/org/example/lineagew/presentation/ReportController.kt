package org.example.lineagew.presentation

import org.example.lineagew.application.dto.DailySettlementReport
import org.example.lineagew.application.dto.ParticipationReport
import org.example.lineagew.application.service.ReportService
import org.example.lineagew.common.BonusWindow
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import java.time.LocalDate

@RestController
@RequestMapping("/api/lineage/reports")
@Validated
class ReportController(
    private val reportService: ReportService
) {

    @GetMapping("/daily-settlement")
    fun getDailySettlement(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate
    ): DailySettlementReport = reportService.getDailySettlementReport(from, to)

    @GetMapping("/participation")
    fun getParticipation(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate,
        @RequestParam window: BonusWindow = BonusWindow.WEEK
    ): ParticipationReport = reportService.getParticipationReport(from, to, window)
}
