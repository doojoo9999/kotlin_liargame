package org.example.kotlin_liargame.domain.invest.service

import java.math.BigDecimal
import org.example.kotlin_liargame.domain.invest.exception.PriceDataUnavailableException
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.springframework.stereotype.Service

interface StockDataService {
    suspend fun getLatestPrice(stockCode: String, marketType: MarketType): BigDecimal
}

@Service
class StubStockDataService : StockDataService {
    override suspend fun getLatestPrice(stockCode: String, marketType: MarketType): BigDecimal {
        throw PriceDataUnavailableException("Price data source not configured for $stockCode ($marketType)")
    }
}
