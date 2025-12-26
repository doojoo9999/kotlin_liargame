package org.example.kotlin_liargame.domain.invest.service

import com.fasterxml.jackson.databind.ObjectMapper
import java.lang.StringBuilder
import kotlinx.coroutines.reactor.awaitSingle
import org.example.kotlin_liargame.domain.invest.config.GeminiProperties
import org.example.kotlin_liargame.domain.invest.dto.GeminiContent
import org.example.kotlin_liargame.domain.invest.dto.GeminiGenerateContentRequest
import org.example.kotlin_liargame.domain.invest.dto.GeminiGenerateContentResponse
import org.example.kotlin_liargame.domain.invest.dto.GeminiGenerationConfig
import org.example.kotlin_liargame.domain.invest.dto.GeminiPart
import org.example.kotlin_liargame.domain.invest.dto.GeminiRecommendation
import org.example.kotlin_liargame.domain.invest.dto.StockAnalysisRequest
import org.example.kotlin_liargame.domain.invest.dto.StockAnalysisResult
import org.example.kotlin_liargame.domain.invest.exception.GeminiApiException
import org.slf4j.LoggerFactory
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException

@Service
class GeminiAnalysisService(
    webClientBuilder: WebClient.Builder,
    private val objectMapper: ObjectMapper,
    private val geminiProperties: GeminiProperties
) {
    private val logger = LoggerFactory.getLogger(this::class.java)
    private val webClient: WebClient = webClientBuilder
        .baseUrl(geminiProperties.baseUrl)
        .build()

    suspend fun analyze(request: StockAnalysisRequest): StockAnalysisResult {
        if (geminiProperties.apiKey.isBlank()) {
            throw GeminiApiException("Gemini API key is not configured")
        }

        val prompt = buildPrompt(request)
        val geminiRequest = GeminiGenerateContentRequest(
            contents = listOf(
                GeminiContent(
                    parts = listOf(GeminiPart(text = prompt))
                )
            ),
            generationConfig = GeminiGenerationConfig(
                temperature = geminiProperties.temperature,
                maxOutputTokens = geminiProperties.maxOutputTokens,
                responseMimeType = "application/json"
            )
        )

        val response = try {
            webClient.post()
                .uri { builder ->
                    builder.path("/models/${geminiProperties.model}:generateContent")
                        .queryParam("key", geminiProperties.apiKey)
                        .build()
                }
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(geminiRequest)
                .retrieve()
                .bodyToMono(GeminiGenerateContentResponse::class.java)
                .awaitSingle()
        } catch (ex: WebClientResponseException) {
            logger.error("Gemini API call failed with status ${ex.statusCode.value()}: ${ex.responseBodyAsString}")
            throw GeminiApiException(
                message = "Gemini API request failed with status ${ex.statusCode.value()}",
                statusCode = ex.statusCode.value(),
                responseBody = ex.responseBodyAsString,
                cause = ex
            )
        } catch (ex: Exception) {
            logger.error("Gemini API call failed: ${ex.message}", ex)
            throw GeminiApiException("Gemini API call failed", cause = ex)
        }

        val text = response.candidates.firstOrNull()
            ?.content
            ?.parts
            ?.firstOrNull()
            ?.text
            ?: throw GeminiApiException("Gemini response missing content")

        val recommendation = parseRecommendation(text)

        return StockAnalysisResult(
            action = recommendation.action,
            targetPrice = recommendation.targetPrice,
            stopLossPrice = recommendation.stopLossPrice,
            riskLevel = recommendation.riskLevel,
            disclaimer = DISCLAIMER
        )
    }

    private fun buildPrompt(request: StockAnalysisRequest): String {
        val trimmedRequest = request.copy(newsHeadlines = request.newsHeadlines.take(5))
        val payloadJson = objectMapper.writeValueAsString(trimmedRequest)
        val prompt = StringBuilder()
        prompt.appendLine("You are a stock analyst.")
        prompt.appendLine("Use the JSON data below to produce an investment recommendation.")
        prompt.appendLine("Return only JSON with the following schema:")
        prompt.appendLine("{")
        prompt.appendLine("  \"action\": \"BUY|SELL|HOLD\",")
        prompt.appendLine("  \"targetPrice\": number,")
        prompt.appendLine("  \"stopLossPrice\": number,")
        prompt.appendLine("  \"riskLevel\": \"LOW|MEDIUM|HIGH\"")
        prompt.appendLine("}")
        prompt.appendLine("Data:")
        prompt.appendLine(payloadJson)
        return prompt.toString().trim()
    }

    private fun parseRecommendation(text: String): GeminiRecommendation {
        val json = extractJson(text)
        return try {
            objectMapper.readValue(json, GeminiRecommendation::class.java)
        } catch (ex: Exception) {
            throw GeminiApiException("Gemini response JSON parsing failed", responseBody = text, cause = ex)
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
        throw GeminiApiException("Gemini response did not include JSON", responseBody = text)
    }

    companion object {
        private const val DISCLAIMER = "For informational purposes only."
    }
}
