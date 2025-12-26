package org.example.kotlin_liargame.domain.invest.exception

class PriceDataUnavailableException(
    message: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)
