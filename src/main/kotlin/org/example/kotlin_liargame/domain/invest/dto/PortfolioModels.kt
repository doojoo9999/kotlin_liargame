package org.example.kotlin_liargame.domain.invest.dto

import java.math.BigDecimal
import java.time.LocalDateTime
import org.example.kotlin_liargame.domain.invest.model.enum.Currency
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.example.kotlin_liargame.domain.invest.model.enum.TradeType

data class TradeRequest(
    val portfolioId: Long,
    val stockCode: String,
    val marketType: MarketType,
    val tradeType: TradeType,
    val tradePrice: BigDecimal,
    val quantity: BigDecimal,
    val tradedAt: LocalDateTime? = null
)

data class AssetPerformance(
    val stockCode: String,
    val marketType: MarketType,
    val quantity: BigDecimal,
    val averagePrice: BigDecimal,
    val currentPrice: BigDecimal?,
    val currentValue: BigDecimal?,
    val pnl: BigDecimal?,
    val roiPercent: BigDecimal?,
    val baseCurrency: Currency,
    val priceAvailable: Boolean
)
