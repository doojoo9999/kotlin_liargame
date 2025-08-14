package org.example.kotlin_liargame.global.dto

import java.time.Instant

data class ErrorResponse(
    val errorCode: String,
    val message: String,
    val userFriendlyMessage: String,
    val details: Map<String, Any>? = null,
    val timestamp: String = Instant.now().toString()
)
