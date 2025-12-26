package org.example.kotlin_liargame.domain.invest.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.example.kotlin_liargame.domain.invest.dto.GeminiRecommendation
import org.example.kotlin_liargame.domain.invest.exception.AiResponseParsingException
import org.springframework.stereotype.Component

@Component
class GeminiResponseParser(
    private val objectMapper: ObjectMapper
) {
    fun parse(rawText: String): GeminiRecommendation {
        val json = extractJson(rawText)
        return try {
            objectMapper.readValue(json, GeminiRecommendation::class.java)
        } catch (ex: Exception) {
            throw AiResponseParsingException("Gemini response JSON parsing failed", rawResponse = rawText, cause = ex)
        }
    }

    private fun extractJson(text: String): String {
        val trimmed = text.trim()
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            return trimmed
        }
        val startIndex = trimmed.indexOf('{')
        val endIndex = trimmed.lastIndexOf('}')
        if (startIndex >= 0 && endIndex > startIndex) {
            return trimmed.substring(startIndex, endIndex + 1)
        }
        throw AiResponseParsingException("Gemini response did not include JSON", rawResponse = text)
    }
}
