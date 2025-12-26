package org.example.kotlin_liargame.domain.invest.service

import java.math.BigDecimal
import org.example.kotlin_liargame.domain.invest.exception.PriceDataUnavailableException
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.springframework.stereotype.Service

@Service
class MarketPriceServiceImpl(
    private val stockDataService: StockDataService
) : MarketPriceService {
    override suspend fun getLatestPrice(stockCode: String, marketType: MarketType): BigDecimal {
        val price = stockDataService.getLatestPrice(stockCode, marketType)
        if (price <= BigDecimal.ZERO) {
            throw PriceDataUnavailableException("Invalid price for $stockCode ($marketType)")
        }
        return FinancialMath.scalePrice(price)
    }
}
