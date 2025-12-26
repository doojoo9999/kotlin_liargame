package org.example.kotlin_liargame.domain.invest.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "invest.gemini")
data class GeminiProperties(
    var apiKey: String = "",
    var baseUrl: String = "https://generativelanguage.googleapis.com/v1beta",
    var model: String = "gemini-3-flash-preview",
    var temperature: Double = 0.2,
    var maxOutputTokens: Int = 512,
    var timeoutSeconds: Long = 15
)
