package org.example.kotlin_liargame.domain.game.model.enum

enum class GameResult {
    LIAR_WIN_BY_GUESS,      // 라이어가 정답을 맞춰서 승리
    LIAR_WIN_BY_VOTE,       // 라이어가 투표에서 살아남아서 승리
    CITIZENS_WIN_BY_VOTE,   // 시민들이 라이어를 찾아서 승리
    CITIZENS_WIN_BY_TIME,   // 시간 초과로 시민들 승리
    GAME_CANCELLED          // 게임 취소
}