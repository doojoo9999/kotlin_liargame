package org.example.kotlin_liargame.global.exception

import org.example.kotlin_liargame.domain.game.model.enum.GameState

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

class UserAlreadyInGameException(
    nickname: String,
    state: GameState
) : GameException(
    errorCode = "USER_ALREADY_IN_GAME",
    message = "User $nickname is already participating in a $state game.",
    userFriendlyMessage = if (state == GameState.IN_PROGRESS) {
        "이미 진행중인 게임에 참여하고 있습니다."
    } else {
        "이미 다른 게임방에 참여하고 있습니다. 기존 게임을 나간 후 다시 시도해주세요."
    }
)

class UserAlreadyOwnsGameException(
    nickname: String,
    gameNumber: Int
) : GameException(
    errorCode = "USER_ALREADY_OWNS_GAME",
    message = "User $nickname already owns game room $gameNumber.",
    userFriendlyMessage = "이미 다른 게임방을 소유하고 있습니다."
)

class RoomNumberAllocationException : GameException(
    errorCode = "ROOM_NUMBER_UNAVAILABLE",
    message = "Unable to allocate a new game room number.",
    userFriendlyMessage = "새로운 방 번호를 발급할 수 없습니다. 잠시 후 다시 시도해주세요."
)

class SessionAuthenticationException(message: String = "Not authenticated") : GameException(
    errorCode = "SESSION_INVALID",
    message = message,
    userFriendlyMessage = "로그인이 필요합니다."
)

class ChatArchivalException(playerNickname: String) : GameException(
    errorCode = "CHAT_ARCHIVAL_FAILED",
    message = "Failed to archive chat messages for $playerNickname",
    userFriendlyMessage = "채팅 기록을 정리하는 중 문제가 발생했습니다."
)

class GameOwnerOnlyActionException : GameException(
    errorCode = "OWNER_ONLY_ACTION",
    message = "Only the game owner can perform this action.",
    userFriendlyMessage = "방장만 수행할 수 있는 작업입니다."
)

class GameRoundMismatchException(currentRound: Int, requestedRound: Int) : GameException(
    errorCode = "ROUND_MISMATCH",
    message = "Round mismatch. Current: $currentRound, Requested: $requestedRound",
    userFriendlyMessage = "라운드 정보가 일치하지 않습니다."
)

class GameStateUnavailableException : GameException(
    errorCode = "GAME_STATE_UNAVAILABLE",
    message = "Game is not yet finished.",
    userFriendlyMessage = "게임이 아직 종료되지 않았습니다."
)

class GameCleanupException(message: String) : GameException(
    errorCode = "GAME_CLEANUP_FAILED",
    message = message,
    userFriendlyMessage = "게임 정리 중 오류가 발생했습니다."
)
