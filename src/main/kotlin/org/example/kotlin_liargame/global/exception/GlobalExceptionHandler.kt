package org.example.kotlin_liargame.global.exception

import org.example.kotlin_liargame.global.dto.ErrorResponse
import org.example.lineagew.domain.boss.exception.DuplicateBossException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.messaging.handler.annotation.MessageExceptionHandler
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.context.request.WebRequest

@RestControllerAdvice
class GlobalExceptionHandler(
    private val messagingTemplate: SimpMessagingTemplate
) {
    
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
        
        println("[ERROR] JSON parsing error: ${ex.mostSpecificCause?.message ?: ex.message}")
        ex.printStackTrace()
        
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
        
        println("[ERROR] Validation error: $fieldErrors")
        
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
        
        println("[ERROR] ${ex.errorCode}: ${ex.message}")
        
        val httpStatus = when (ex) {
            is GameNotFoundException -> HttpStatus.NOT_FOUND
            is PlayerNotInGameException, is InvalidTurnException -> HttpStatus.FORBIDDEN
            is RoomFullException -> HttpStatus.BAD_REQUEST
            is GameAlreadyStartedException -> HttpStatus.CONFLICT
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
        
        println("[ERROR] IllegalArgumentException: ${ex.message}")
        
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

        println("[ERROR] DuplicateBossException: ${ex.message}")

        return ResponseEntity(errorResponse, HttpStatus.CONFLICT)
    }

    @ExceptionHandler(IllegalStateException::class)
    fun handleIllegalStateException(
        ex: IllegalStateException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = "INVALID_STATE",
            message = ex.message ?: "Invalid state",
            userFriendlyMessage = "현재 상태에서는 해당 작업을 수행할 수 없습니다.",
            details = mapOf(
                "path" to request.getDescription(false)
            )
        )
        
        println("[ERROR] IllegalStateException: ${ex.message}")
        
        return ResponseEntity(errorResponse, HttpStatus.CONFLICT)
    }
    
    @ExceptionHandler(Exception::class)
    fun handleGenericException(
        ex: Exception,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = "INTERNAL_ERROR",
            message = "Internal server error",
            userFriendlyMessage = "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            details = mapOf(
                "path" to request.getDescription(false),
                "exceptionType" to ex.javaClass.simpleName
            )
        )
        
        println("[ERROR] Unhandled exception: ${ex.message}")
        ex.printStackTrace()
        
        return ResponseEntity(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    
    @MessageExceptionHandler(GameException::class)
    fun handleWebSocketGameException(ex: GameException): ErrorResponse {
        val errorResponse = ErrorResponse(
            errorCode = ex.errorCode,
            message = ex.message,
            userFriendlyMessage = ex.userFriendlyMessage
        )
        
        println("[WEBSOCKET_ERROR] ${ex.errorCode}: ${ex.message}")
        
        return errorResponse
    }
    
    @MessageExceptionHandler(Exception::class)
    fun handleWebSocketGenericException(ex: Exception): ErrorResponse {
        val errorResponse = ErrorResponse(
            errorCode = "WEBSOCKET_ERROR",
            message = "WebSocket communication error",
            userFriendlyMessage = "실시간 통신 중 오류가 발생했습니다."
        )
        
        println("[WEBSOCKET_ERROR] Unhandled WebSocket exception: ${ex.message}")
        ex.printStackTrace()
        
        return errorResponse
    }
}
