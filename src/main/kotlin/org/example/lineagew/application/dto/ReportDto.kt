package org.example.lineagew.application.dto

import org.example.lineagew.common.BonusWindow
import java.math.BigDecimal
import java.time.LocalDate

data class DailySettlementRow(
    val date: LocalDate,
    val payouts: List<MemberPayoutCell>,
    val rowTotal: Long
)

data class MemberPayoutCell(
    val memberId: Long,
    val memberName: String,
    val amount: Long
)

data class DailySettlementReport(
    val rows: List<DailySettlementRow>,
    val columnTotals: Map<Long, Long>,
    val grandTotal: Long
)

data class ParticipationWindowSummary(
    val memberId: Long,
    val memberName: String,
    val windowStart: LocalDate,
    val windowEnd: LocalDate,
    val participationCount: Double,
    val bonusMultiplier: BigDecimal?
)

data class ParticipationReport(
    val window: BonusWindow,
    val summaries: List<ParticipationWindowSummary>
)
