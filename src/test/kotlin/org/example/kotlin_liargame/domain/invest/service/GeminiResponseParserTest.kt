package org.example.kotlin_liargame.domain.invest.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.example.kotlin_liargame.domain.invest.model.enum.InvestmentAction
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class GeminiResponseParserTest {
    private val objectMapper = ObjectMapper().findAndRegisterModules()

    @Test
    fun `parse extracts structured recommendation`() {
        val parser = GeminiResponseParser(objectMapper)
        val raw = """
            {
              "recommendation": "BUY",
              "target_price": 123.45,
              "stop_loss": 100.0,
              "confidence_score": 85,
              "reasoning_short": "RSI is oversold and MACD shows bullish crossover"
            }
        """.trimIndent()

        val result = parser.parse(raw)

        assertEquals(InvestmentAction.BUY, result.recommendation)
        assertEquals("123.45", result.targetPrice.toPlainString())
        assertEquals("100.0", result.stopLoss.toPlainString())
        assertEquals(85, result.confidenceScore)
    }
}
