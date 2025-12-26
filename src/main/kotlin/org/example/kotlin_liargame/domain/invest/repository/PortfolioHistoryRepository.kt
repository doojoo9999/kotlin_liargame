package org.example.kotlin_liargame.domain.invest.repository

import java.time.LocalDate
import org.example.kotlin_liargame.domain.invest.model.PortfolioHistoryEntity
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.springframework.data.jpa.repository.JpaRepository

interface PortfolioHistoryRepository : JpaRepository<PortfolioHistoryEntity, Long> {
    fun findByPortfolioIdAndAsOfDateAndMarketType(
        portfolioId: Long,
        asOfDate: LocalDate,
        marketType: MarketType?
    ): PortfolioHistoryEntity?
}
