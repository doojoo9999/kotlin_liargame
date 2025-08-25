package org.example.kotlin_liargame.global.exception

open class GameException(
    val errorCode: String,
    override val message: String,
    val userFriendlyMessage: String
) : RuntimeException(message)

class GameNotFoundException(gameNumber: Int) : GameException(
    errorCode = "GAME_NOT_FOUND",
    message = "Game room $gameNumber not found.",
    userFriendlyMessage = "존재하지 않는 게임방입니다."
)

class RoomFullException(gameNumber: Int) : GameException(
    errorCode = "ROOM_FULL",
    message = "Game room $gameNumber is full.",
    userFriendlyMessage = "방이 가득 찼습니다."
)

class GameAlreadyStartedException(gameNumber: Int) : GameException(
    errorCode = "GAME_ALREADY_STARTED",
    message = "Game $gameNumber has already started.",
    userFriendlyMessage = "이미 시작된 게임입니다."
)

class PlayerNotInGameException(userId: Long, gameNumber: Int) : GameException(
    errorCode = "PLAYER_NOT_IN_GAME",
    message = "User $userId is not a player in game $gameNumber.",
    userFriendlyMessage = "이 게임의 플레이어가 아닙니다."
)

class InvalidTurnException(userId: Long) : GameException(
    errorCode = "INVALID_TURN",
    message = "It is not user $userId's turn.",
    userFriendlyMessage = "당신의 턴이 아닙니다."
)

class UserNotFoundException(message: String) : GameException(
    errorCode = "USER_NOT_FOUND",
    message = message,
    userFriendlyMessage = "사용자를 찾을 수 없습니다."
)

class NotFoundException(message: String) : GameException(
    errorCode = "NOT_FOUND",
    message = message,
    userFriendlyMessage = "요청한 대상을 찾을 수 없습니다."
)
