package org.example.kotlin_liargame.domain.invest.service

import jakarta.transaction.Transactional
import java.time.LocalDate
import org.example.kotlin_liargame.domain.invest.model.PortfolioHistoryEntity
import org.example.kotlin_liargame.domain.invest.model.enum.Currency
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.example.kotlin_liargame.domain.invest.repository.PortfolioHistoryRepository
import org.example.kotlin_liargame.domain.invest.repository.PortfolioRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class PortfolioHistoryService(
    private val portfolioRepository: PortfolioRepository,
    private val portfolioHistoryRepository: PortfolioHistoryRepository,
    private val portfolioService: PortfolioService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    @Transactional
    suspend fun recordDailySnapshot(marketType: MarketType?, baseCurrency: Currency, asOfDate: LocalDate = LocalDate.now()): Int {
        val portfolios = portfolioRepository.findAll()
        if (portfolios.isEmpty()) {
            return 0
        }
        var savedCount = 0
        for (portfolio in portfolios) {
            val existing = portfolioHistoryRepository.findByPortfolioIdAndAsOfDateAndMarketType(
                portfolioId = portfolio.id,
                asOfDate = asOfDate,
                marketType = marketType
            )
            if (existing != null) {
                continue
            }
            try {
                val totalValue = portfolioService.calculatePortfolioValue(portfolio, baseCurrency)
                portfolioHistoryRepository.save(
                    PortfolioHistoryEntity(
                        portfolio = portfolio,
                        asOfDate = asOfDate,
                        marketType = marketType,
                        baseCurrency = baseCurrency,
                        totalValue = totalValue
                    )
                )
                savedCount++
            } catch (ex: Exception) {
                logger.warn(\"Failed to record portfolio history for ${portfolio.id}: ${ex.message}\")
            }
        }
        logger.info("Saved {} portfolio history snapshots for {}", savedCount, asOfDate)
        return savedCount
    }
}
