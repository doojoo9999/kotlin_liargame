package org.example.kotlin_liargame.global.exception

/**
 * Custom exception classes for game-related errors
 */

// Base game exception
abstract class GameException(
    message: String,
    val errorCode: String,
    val userFriendlyMessage: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)

// Game state exceptions
class GameNotFoundException(gameNumber: Int) : GameException(
    message = "Game not found: $gameNumber",
    errorCode = "GAME_NOT_FOUND",
    userFriendlyMessage = "게임을 찾을 수 없습니다."
)

class GameStateException(message: String, userFriendlyMessage: String) : GameException(
    message = message,
    errorCode = "INVALID_GAME_STATE",
    userFriendlyMessage = userFriendlyMessage
)

class GameFullException(gameNumber: Int) : GameException(
    message = "Game is full: $gameNumber",
    errorCode = "GAME_FULL",
    userFriendlyMessage = "게임이 가득 찼습니다."
)

// Player exceptions
class PlayerNotFoundException(playerId: Long) : GameException(
    message = "Player not found: $playerId",
    errorCode = "PLAYER_NOT_FOUND",
    userFriendlyMessage = "플레이어를 찾을 수 없습니다."
)

class PlayerNotInGameException(playerId: Long, gameNumber: Int) : GameException(
    message = "Player $playerId not in game $gameNumber",
    errorCode = "PLAYER_NOT_IN_GAME",
    userFriendlyMessage = "해당 게임에 참여하지 않은 플레이어입니다."
)

class UnauthorizedActionException(action: String) : GameException(
    message = "Unauthorized action: $action",
    errorCode = "UNAUTHORIZED_ACTION",
    userFriendlyMessage = "권한이 없는 행동입니다."
)

// Topic guessing exceptions
class TopicGuessException(message: String, userFriendlyMessage: String) : GameException(
    message = message,
    errorCode = "TOPIC_GUESS_ERROR",
    userFriendlyMessage = userFriendlyMessage
)

class TopicGuessTimeoutException(gameNumber: Int) : GameException(
    message = "Topic guess timeout for game $gameNumber",
    errorCode = "TOPIC_GUESS_TIMEOUT",
    userFriendlyMessage = "주제 맞추기 시간이 초과되었습니다."
)

// Voting exceptions
class VotingException(message: String, userFriendlyMessage: String) : GameException(
    message = message,
    errorCode = "VOTING_ERROR",
    userFriendlyMessage = userFriendlyMessage
)

class InvalidVoteException(reason: String) : GameException(
    message = "Invalid vote: $reason",
    errorCode = "INVALID_VOTE",
    userFriendlyMessage = "유효하지 않은 투표입니다."
)

// WebSocket exceptions
class WebSocketException(message: String, userFriendlyMessage: String) : GameException(
    message = message,
    errorCode = "WEBSOCKET_ERROR",
    userFriendlyMessage = userFriendlyMessage
)

class ConnectionException(message: String) : GameException(
    message = message,
    errorCode = "CONNECTION_ERROR",
    userFriendlyMessage = "연결에 문제가 발생했습니다."
)

// Concurrency exceptions
class ConcurrencyException(operation: String) : GameException(
    message = "Concurrency conflict in operation: $operation",
    errorCode = "CONCURRENCY_ERROR",
    userFriendlyMessage = "동시 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
)

// Rate limiting exceptions
class RateLimitExceededException(action: String) : GameException(
    message = "Rate limit exceeded for action: $action",
    errorCode = "RATE_LIMIT_EXCEEDED",
    userFriendlyMessage = "요청이 너무 빈번합니다. 잠시 후 다시 시도해주세요."
)

// Error response data class
data class ErrorResponse(
    val success: Boolean = false,
    val errorCode: String,
    val message: String,
    val userFriendlyMessage: String,
    val timestamp: Long = System.currentTimeMillis(),
    val details: Map<String, Any>? = null
)

// Error codes enum for consistency
enum class GameErrorCode(val code: String, val defaultMessage: String) {
    GAME_NOT_FOUND("GAME_NOT_FOUND", "게임을 찾을 수 없습니다."),
    PLAYER_NOT_FOUND("PLAYER_NOT_FOUND", "플레이어를 찾을 수 없습니다."),
    INVALID_GAME_STATE("INVALID_GAME_STATE", "잘못된 게임 상태입니다."),
    UNAUTHORIZED_ACTION("UNAUTHORIZED_ACTION", "권한이 없는 행동입니다."),
    TOPIC_GUESS_ERROR("TOPIC_GUESS_ERROR", "주제 맞추기 중 오류가 발생했습니다."),
    VOTING_ERROR("VOTING_ERROR", "투표 중 오류가 발생했습니다."),
    WEBSOCKET_ERROR("WEBSOCKET_ERROR", "실시간 통신 중 오류가 발생했습니다."),
    CONCURRENCY_ERROR("CONCURRENCY_ERROR", "동시 처리 중 오류가 발생했습니다."),
    RATE_LIMIT_EXCEEDED("RATE_LIMIT_EXCEEDED", "요청이 너무 빈번합니다."),
    INTERNAL_ERROR("INTERNAL_ERROR", "내부 서버 오류가 발생했습니다.")
}