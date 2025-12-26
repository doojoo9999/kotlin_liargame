package org.example.kotlin_liargame.domain.invest.dto

data class GeminiGenerateContentRequest(
    val contents: List<GeminiContent>,
    val generationConfig: GeminiGenerationConfig? = null
)

data class GeminiContent(
    val role: String = "user",
    val parts: List<GeminiPart>
)

data class GeminiPart(
    val text: String
)

data class GeminiGenerationConfig(
    val temperature: Double = 0.2,
    val maxOutputTokens: Int = 512,
    val responseMimeType: String? = null
)

data class GeminiGenerateContentResponse(
    val candidates: List<GeminiCandidate> = emptyList()
)

data class GeminiCandidate(
    val content: GeminiResponseContent? = null
)

data class GeminiResponseContent(
    val parts: List<GeminiResponsePart> = emptyList()
)

data class GeminiResponsePart(
    val text: String? = null
)
