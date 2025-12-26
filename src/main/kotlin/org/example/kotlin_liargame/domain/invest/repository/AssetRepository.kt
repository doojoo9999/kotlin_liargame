package org.example.kotlin_liargame.domain.invest.repository

import org.example.kotlin_liargame.domain.invest.model.AssetEntity
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.springframework.data.jpa.repository.JpaRepository

interface AssetRepository : JpaRepository<AssetEntity, Long> {
    fun findByPortfolioIdAndStockCodeAndMarketType(
        portfolioId: Long,
        stockCode: String,
        marketType: MarketType
    ): AssetEntity?

    fun findByPortfolioId(portfolioId: Long): List<AssetEntity>

    fun findByMarketTypeIn(marketTypes: Collection<MarketType>): List<AssetEntity>
}
