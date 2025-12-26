package org.example.kotlin_liargame.domain.invest.service

import java.math.BigDecimal
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType

interface MarketPriceService {
    suspend fun getLatestPrice(stockCode: String, marketType: MarketType): BigDecimal
}
