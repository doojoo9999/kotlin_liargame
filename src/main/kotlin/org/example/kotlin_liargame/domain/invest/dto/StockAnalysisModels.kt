package org.example.kotlin_liargame.domain.invest.dto

import com.fasterxml.jackson.annotation.JsonCreator
import java.math.BigDecimal
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
    val action: InvestmentAction,
    val targetPrice: BigDecimal,
    val stopLossPrice: BigDecimal,
    val riskLevel: RiskLevel,
    val disclaimer: String
)

data class GeminiRecommendation(
    val action: InvestmentAction,
    val targetPrice: BigDecimal,
    val stopLossPrice: BigDecimal,
    val riskLevel: RiskLevel
)

enum class InvestmentAction {
    BUY,
    SELL,
    HOLD;

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): InvestmentAction {
            return entries.firstOrNull { it.name.equals(value.trim(), ignoreCase = true) }
                ?: throw IllegalArgumentException("Unknown investment action: $value")
        }
    }
}

enum class RiskLevel {
    LOW,
    MEDIUM,
    HIGH;

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): RiskLevel {
            return entries.firstOrNull { it.name.equals(value.trim(), ignoreCase = true) }
                ?: throw IllegalArgumentException("Unknown risk level: $value")
        }
    }
}
