package org.example.kotlin_liargame.domain.invest.service

import com.fasterxml.jackson.databind.ObjectMapper
import java.lang.StringBuilder
import java.time.Duration
import java.util.concurrent.TimeoutException
import kotlinx.coroutines.reactor.awaitSingle
import org.example.kotlin_liargame.domain.invest.config.GeminiProperties
import org.example.kotlin_liargame.domain.invest.dto.GeminiContent
import org.example.kotlin_liargame.domain.invest.dto.GeminiGenerateContentRequest
import org.example.kotlin_liargame.domain.invest.dto.GeminiGenerateContentResponse
import org.example.kotlin_liargame.domain.invest.dto.GeminiGenerationConfig
import org.example.kotlin_liargame.domain.invest.dto.GeminiPart
import org.example.kotlin_liargame.domain.invest.dto.StockAnalysisRequest
import org.example.kotlin_liargame.domain.invest.dto.StockAnalysisResult
import org.example.kotlin_liargame.domain.invest.exception.AiResponseParsingException
import org.example.kotlin_liargame.domain.invest.exception.ExternalApiTimeoutException
import org.example.kotlin_liargame.domain.invest.exception.GeminiApiException
import org.example.kotlin_liargame.domain.invest.model.AssetEntity
import org.example.kotlin_liargame.domain.invest.model.StockAnalysisResultEntity
import org.example.kotlin_liargame.domain.invest.repository.StockAnalysisResultRepository
import org.slf4j.LoggerFactory
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException

@Service
class GeminiAnalysisService(
    webClientBuilder: WebClient.Builder,
    private val objectMapper: ObjectMapper,
    private val geminiProperties: GeminiProperties,
    private val responseParser: GeminiResponseParser,
    private val analysisRepository: StockAnalysisResultRepository
) {
    private val logger = LoggerFactory.getLogger(this::class.java)
    private val webClient: WebClient = webClientBuilder
        .baseUrl(geminiProperties.baseUrl)
        .build()

    suspend fun analyze(request: StockAnalysisRequest, asset: AssetEntity? = null): StockAnalysisResult {
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
                .timeout(Duration.ofSeconds(geminiProperties.timeoutSeconds))
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
            val timeout = ex is TimeoutException || ex.cause is TimeoutException
            if (timeout) {
                throw ExternalApiTimeoutException("Gemini API timed out", serviceName = "Gemini", cause = ex)
            }
            logger.error("Gemini API call failed: ${ex.message}", ex)
            throw GeminiApiException("Gemini API call failed", cause = ex)
        }

        val text = response.candidates.firstOrNull()
            ?.content
            ?.parts
            ?.firstOrNull()
            ?.text
            ?: throw GeminiApiException("Gemini response missing content")

        val recommendation = responseParser.parse(text)
        validateRecommendation(recommendation.confidenceScore)
        val reasoningShort = recommendation.reasoningShort.take(MAX_REASONING_LENGTH)

        val analysisEntity = StockAnalysisResultEntity(
            asset = asset,
            stockCode = request.stockCode,
            marketType = request.marketType,
            currentPrice = FinancialMath.scalePrice(request.currentPrice),
            recommendation = recommendation.recommendation,
            targetPrice = FinancialMath.scalePrice(recommendation.targetPrice),
            stopLoss = FinancialMath.scalePrice(recommendation.stopLoss),
            confidenceScore = recommendation.confidenceScore,
            reasoningShort = reasoningShort
        )
        analysisRepository.save(analysisEntity)

        return StockAnalysisResult(
            recommendation = recommendation.recommendation,
            targetPrice = FinancialMath.scalePrice(recommendation.targetPrice),
            stopLoss = FinancialMath.scalePrice(recommendation.stopLoss),
            confidenceScore = recommendation.confidenceScore,
            reasoningShort = reasoningShort,
            disclaimer = DISCLAIMER
        )
    }

    private fun buildPrompt(request: StockAnalysisRequest): String {
        val trimmedRequest = request.copy(newsHeadlines = request.newsHeadlines.take(5))
        val payloadJson = objectMapper.writeValueAsString(trimmedRequest)
        val prompt = StringBuilder()
        prompt.appendLine("Provide a technical analysis for ${request.stockCode}.")
        prompt.appendLine("Use these indicators: RSI, MACD, MA.")
        prompt.appendLine("Current News: ${trimmedRequest.newsHeadlines.joinToString(" | ")}")
        prompt.appendLine("Return ONLY a JSON object with keys: \"recommendation\", \"target_price\", \"stop_loss\", \"confidence_score\", \"reasoning_short\".")
        prompt.appendLine("Allowed values: recommendation=BUY|SELL|HOLD, confidence_score=0-100.")
        prompt.appendLine("Data:")
        prompt.appendLine(payloadJson)
        return prompt.toString().trim()
    }

    private fun validateRecommendation(confidenceScore: Int) {
        if (confidenceScore < 0 || confidenceScore > 100) {
            throw AiResponseParsingException("Confidence score out of range: $confidenceScore")
        }
    }

    companion object {
        private const val DISCLAIMER = "For informational purposes only."
        private const val MAX_REASONING_LENGTH = 500
    }
}
