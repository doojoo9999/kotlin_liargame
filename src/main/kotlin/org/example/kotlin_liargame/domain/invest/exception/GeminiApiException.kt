package org.example.kotlin_liargame.domain.invest.exception

class GeminiApiException(
    message: String,
    val statusCode: Int? = null,
    val responseBody: String? = null,
    cause: Throwable? = null
) : RuntimeException(message, cause)
