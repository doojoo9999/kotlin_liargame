package org.example.kotlin_liargame.domain.invest.service

import java.time.LocalDate
import java.time.ZoneId
import kotlinx.coroutines.runBlocking
import org.example.kotlin_liargame.domain.invest.model.enum.Currency
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class PortfolioHistoryScheduler(
    private val portfolioHistoryService: PortfolioHistoryService
) {
    @Scheduled(cron = "0 40 15 * * MON-FRI", zone = "Asia/Seoul")
    fun recordKrCloseSnapshot() = runBlocking {
        val asOfDate = LocalDate.now(ZoneId.of("Asia/Seoul"))
        portfolioHistoryService.recordDailySnapshot(MarketType.KR, Currency.KRW, asOfDate)
    }

    @Scheduled(cron = "0 10 16 * * MON-FRI", zone = "America/New_York")
    fun recordUsCloseSnapshot() = runBlocking {
        val asOfDate = LocalDate.now(ZoneId.of("America/New_York"))
        portfolioHistoryService.recordDailySnapshot(MarketType.US, Currency.KRW, asOfDate)
    }
}
