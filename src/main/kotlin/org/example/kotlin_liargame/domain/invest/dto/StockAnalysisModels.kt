package org.example.kotlin_liargame.domain.invest.dto

import com.fasterxml.jackson.annotation.JsonProperty
import java.math.BigDecimal
import org.example.kotlin_liargame.domain.invest.model.enum.InvestmentAction
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType

data class StockAnalysisRequest(
    val stockCode: String,
    val marketType: MarketType,
    val currentPrice: BigDecimal,
    val technicalIndicators: TechnicalIndicators,
    val newsHeadlines: List<String>
)

data class TechnicalIndicators(
    val rsi: Double?,
    val macd: Double?,
    val macdSignal: Double?,
    val ma20: Double?,
    val ma60: Double?,
    val ma120: Double?
)

data class StockAnalysisResult(
    val recommendation: InvestmentAction,
    val targetPrice: BigDecimal,
    val stopLoss: BigDecimal,
    val confidenceScore: Int,
    val reasoningShort: String,
    val disclaimer: String
)

data class GeminiRecommendation(
    @JsonProperty("recommendation")
    val recommendation: InvestmentAction,
    @JsonProperty("target_price")
    val targetPrice: BigDecimal,
    @JsonProperty("stop_loss")
    val stopLoss: BigDecimal,
    @JsonProperty("confidence_score")
    val confidenceScore: Int,
    @JsonProperty("reasoning_short")
    val reasoningShort: String
)
