package org.example.kotlin_liargame.domain.invest.exception

class AiResponseParsingException(
    message: String,
    val rawResponse: String? = null,
    cause: Throwable? = null
) : RuntimeException(message, cause)
