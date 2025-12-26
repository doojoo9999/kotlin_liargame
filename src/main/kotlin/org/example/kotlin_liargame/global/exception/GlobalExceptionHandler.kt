package org.example.kotlin_liargame.global.exception

import org.example.kotlin_liargame.global.dto.ErrorResponse
import org.example.kotlin_liargame.domain.invest.exception.AiResponseParsingException
import org.example.kotlin_liargame.domain.invest.exception.ExternalApiTimeoutException
import org.example.kotlin_liargame.domain.invest.exception.GeminiApiException
import org.example.kotlin_liargame.domain.invest.exception.PriceDataUnavailableException
import org.example.lineagew.domain.boss.exception.DuplicateBossException
import org.springframework.http.HttpStatus
import org.springframework.http.HttpStatusCode
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.messaging.handler.annotation.MessageExceptionHandler
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.context.request.WebRequest
import org.springframework.web.server.ResponseStatusException

@RestControllerAdvice
class GlobalExceptionHandler(
    private val messagingTemplate: SimpMessagingTemplate
) {
    private val logger = org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler::class.java)
    
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleHttpMessageNotReadableException(
        ex: HttpMessageNotReadableException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = "JSON_PARSE_ERROR",
            message = "Invalid JSON format",
            userFriendlyMessage = "요청 데이터 형식이 올바르지 않습니다.",
            details = mapOf(
                "path" to request.getDescription(false),
                "error" to (ex.mostSpecificCause?.message ?: ex.message ?: "Unknown JSON parsing error")
            )
        )
        
        logger.error("JSON parsing error: {}", ex.mostSpecificCause?.message ?: ex.message, ex)
        
        return ResponseEntity(errorResponse, HttpStatus.BAD_REQUEST)
    }
    
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(ex: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val fieldErrors = ex.bindingResult.fieldErrors.associate { error ->
            error.field to (error.defaultMessage ?: "Invalid value")
        }
        
        val errorResponse = ErrorResponse(
            errorCode = "VALIDATION_ERROR",
            message = "Validation failed",
            userFriendlyMessage = "입력값이 올바르지 않습니다.",
            details = mapOf("fieldErrors" to fieldErrors)
        )
        
        logger.error("Validation error: {}", fieldErrors)
        
        return ResponseEntity(errorResponse, HttpStatus.BAD_REQUEST)
    }
    
    @ExceptionHandler(GameException::class)
    fun handleGameException(
        ex: GameException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = ex.errorCode,
            message = ex.message,
            userFriendlyMessage = ex.userFriendlyMessage,
            details = mapOf(
                "path" to request.getDescription(false)
            )
        )
        
        logger.error("{}: {}", ex.errorCode, ex.message)
        
        val httpStatus = when (ex) {
            is GameNotFoundException -> HttpStatus.NOT_FOUND
            is PlayerNotInGameException, is InvalidTurnException -> HttpStatus.FORBIDDEN
            is RoomFullException -> HttpStatus.BAD_REQUEST
            is GameAlreadyStartedException -> HttpStatus.CONFLICT
            is UserAlreadyInGameException, is UserAlreadyOwnsGameException -> HttpStatus.CONFLICT
            is SessionAuthenticationException -> HttpStatus.UNAUTHORIZED
            is GameOwnerOnlyActionException, is GameRoundMismatchException -> HttpStatus.BAD_REQUEST
            is GameStateUnavailableException -> HttpStatus.CONFLICT
            is RoomNumberAllocationException -> HttpStatus.SERVICE_UNAVAILABLE
            is ChatArchivalException, is GameCleanupException -> HttpStatus.INTERNAL_SERVER_ERROR
            else -> HttpStatus.INTERNAL_SERVER_ERROR
        }
        
        return ResponseEntity(errorResponse, httpStatus)
    }
    
    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgumentException(
        ex: IllegalArgumentException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = "INVALID_ARGUMENT",
            message = ex.message ?: "Invalid argument",
            userFriendlyMessage = "잘못된 요청입니다.",
            details = mapOf(
                "path" to request.getDescription(false)
            )
        )
        
        logger.error("IllegalArgumentException: {}", ex.message)
        
        return ResponseEntity(errorResponse, HttpStatus.BAD_REQUEST)
    }

    @ExceptionHandler(DuplicateBossException::class)
    fun handleDuplicateBossException(
        ex: DuplicateBossException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = "DUPLICATE_BOSS",
            message = ex.message ?: "Boss already exists",
            userFriendlyMessage = "이미 등록된 보스가 있습니다.",
            details = mapOf(
                "path" to request.getDescription(false),
                "bossName" to ex.bossName
            )
        )

        logger.error("DuplicateBossException: {}", ex.message)

        return ResponseEntity(errorResponse, HttpStatus.CONFLICT)
    }

    @ExceptionHandler(ResponseStatusException::class)
    fun handleResponseStatusException(
        ex: ResponseStatusException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val status = resolveHttpStatus(ex.statusCode)
        val errorResponse = ErrorResponse(
            errorCode = status.name,
            message = ex.reason ?: status.reasonPhrase,
            userFriendlyMessage = ex.reason ?: status.reasonPhrase,
            details = mapOf(
                "path" to request.getDescription(false),
                "exceptionType" to ex.javaClass.simpleName
            )
        )

        logger.error("ResponseStatusException({}): {}", status.value(), ex.reason)

        return ResponseEntity(errorResponse, status)
    }

    @ExceptionHandler(IllegalStateException::class)
    fun handleIllegalStateException(
        ex: IllegalStateException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = "ILLEGAL_STATE",
            message = ex.message ?: "Illegal state",
            userFriendlyMessage = "게임 상태가 올바르지 않습니다."
        )

        logger.error("IllegalStateException: {}", ex.message)

        return ResponseEntity(errorResponse, HttpStatus.BAD_REQUEST)
    }

    @ExceptionHandler(GeminiApiException::class)
    fun handleGeminiApiException(
        ex: GeminiApiException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val status = when (ex.statusCode) {
            429 -> HttpStatus.TOO_MANY_REQUESTS
            in 500..599 -> HttpStatus.SERVICE_UNAVAILABLE
            else -> HttpStatus.BAD_GATEWAY
        }

        val errorResponse = ErrorResponse(
            errorCode = if (status == HttpStatus.TOO_MANY_REQUESTS) "GEMINI_RATE_LIMIT" else "GEMINI_API_ERROR",
            message = ex.message ?: "Gemini API error",
            userFriendlyMessage = "AI service is temporarily unavailable.",
            details = mapOf(
                "path" to request.getDescription(false),
                "statusCode" to (ex.statusCode ?: "unknown")
            )
        )

        logger.error("GeminiApiException({}): {}", status.value(), ex.message)

        return ResponseEntity(errorResponse, status)
    }

    @ExceptionHandler(ExternalApiTimeoutException::class)
    fun handleExternalApiTimeoutException(
        ex: ExternalApiTimeoutException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = "EXTERNAL_API_TIMEOUT",
            message = ex.message ?: "External API timeout",
            userFriendlyMessage = "외부 서비스 응답이 지연되고 있습니다.",
            details = mapOf(
                "path" to request.getDescription(false),
                "service" to (ex.serviceName ?: "unknown")
            )
        )

        logger.error("ExternalApiTimeoutException: {}", ex.message)

        return ResponseEntity(errorResponse, HttpStatus.GATEWAY_TIMEOUT)
    }

    @ExceptionHandler(AiResponseParsingException::class)
    fun handleAiResponseParsingException(
        ex: AiResponseParsingException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = "AI_RESPONSE_PARSING_ERROR",
            message = ex.message ?: "AI response parsing error",
            userFriendlyMessage = "AI 응답을 처리할 수 없습니다.",
            details = mapOf(
                "path" to request.getDescription(false)
            )
        )

        logger.error("AiResponseParsingException: {}", ex.message)

        return ResponseEntity(errorResponse, HttpStatus.BAD_GATEWAY)
    }

    @ExceptionHandler(PriceDataUnavailableException::class)
    fun handlePriceDataUnavailableException(
        ex: PriceDataUnavailableException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = "PRICE_DATA_UNAVAILABLE",
            message = ex.message ?: "Price data unavailable",
            userFriendlyMessage = "시세 데이터를 불러올 수 없습니다.",
            details = mapOf(
                "path" to request.getDescription(false)
            )
        )

        logger.error("PriceDataUnavailableException: {}", ex.message)

        return ResponseEntity(errorResponse, HttpStatus.SERVICE_UNAVAILABLE)
    }
    
    @MessageExceptionHandler(Exception::class)
    fun handleWebSocketGenericException(ex: Exception): ErrorResponse {
        val errorResponse = ErrorResponse(
            errorCode = "WEBSOCKET_ERROR",
            message = "WebSocket communication error",
            userFriendlyMessage = "실시간 통신 중 오류가 발생했습니다."
        )
        
        logger.error("[WEBSOCKET_ERROR] Unhandled WebSocket exception: {}", ex.message, ex)
        
        return errorResponse
    }

    private fun resolveHttpStatus(statusCode: HttpStatusCode): HttpStatus =
        HttpStatus.resolve(statusCode.value()) ?: HttpStatus.INTERNAL_SERVER_ERROR
}
