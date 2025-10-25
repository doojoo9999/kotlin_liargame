package org.example.lineagew.application.service

import org.example.lineagew.application.dto.*
import org.example.lineagew.common.BonusWindow
import org.example.lineagew.domain.sale.ParticipationBonusLogRepository
import org.example.lineagew.domain.sale.PayoutRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class ReportService(
    private val payoutRepository: PayoutRepository,
    private val participationBonusLogRepository: ParticipationBonusLogRepository
) {

    @Transactional(readOnly = true)
    fun getDailySettlementReport(from: LocalDate, to: LocalDate): DailySettlementReport {
        val start = from.atStartOfDay()
        val end = to.plusDays(1).atStartOfDay().minusNanos(1)
        val payouts = payoutRepository.findAllFinalizedBetween(start, end)

        val rows = payouts.groupBy { it.sale.soldAt.toLocalDate() }
            .toSortedMap()
            .map { (date, datePayouts) ->
                val cells = datePayouts
                    .groupBy { it.member.id!! }
                    .map { (_, memberPayouts) ->
                        val first = memberPayouts.first()
                        MemberPayoutCell(
                            memberId = first.member.id!!,
                            memberName = first.member.name,
                            amount = memberPayouts.sumOf { it.amount }
                        )
                    }
                    .sortedBy { it.memberName.lowercase() }
                DailySettlementRow(
                    date = date,
                    payouts = cells,
                    rowTotal = cells.sumOf { it.amount }
                )
            }

        val columnTotals = payouts.groupBy { it.member.id!! }
            .mapValues { (_, memberPayouts) -> memberPayouts.sumOf { it.amount } }

        val grandTotal = columnTotals.values.sum()

        return DailySettlementReport(
            rows = rows,
            columnTotals = columnTotals,
            grandTotal = grandTotal
        )
    }

    @Transactional(readOnly = true)
    fun getParticipationReport(
        from: LocalDate,
        to: LocalDate,
        window: BonusWindow
    ): ParticipationReport {
        val start = from.atStartOfDay()
        val end = to.plusDays(1).atStartOfDay().minusNanos(1)

        val logs = participationBonusLogRepository.findAllWithinSaleRange(start, end)
            .filter { it.bonusWindow == window }

        val summaries = logs.map { log ->
            val saleDate = log.sale.soldAt.toLocalDate()
            val windowDays = window.toDuration().toDays()
            val windowStart = saleDate.minusDays(windowDays - 1)
            ParticipationWindowSummary(
                memberId = log.member.id!!,
                memberName = log.member.name,
                windowStart = windowStart,
                windowEnd = saleDate,
                participationCount = log.score,
                bonusMultiplier = log.multiplier
            )
        }.sortedWith(compareBy<ParticipationWindowSummary> { it.memberName }
            .thenBy { it.windowEnd })

        return ParticipationReport(
            window = window,
            summaries = summaries
        )
    }
}
