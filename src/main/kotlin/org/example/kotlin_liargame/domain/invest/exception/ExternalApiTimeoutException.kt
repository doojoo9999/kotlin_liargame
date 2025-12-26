package org.example.kotlin_liargame.domain.invest.exception

class ExternalApiTimeoutException(
    message: String,
    val serviceName: String? = null,
    cause: Throwable? = null
) : RuntimeException(message, cause)
