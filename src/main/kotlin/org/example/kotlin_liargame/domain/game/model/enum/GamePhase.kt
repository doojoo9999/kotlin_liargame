package org.example.kotlin_liargame.domain.game.model.enum

enum class GamePhase {
    WAITING_FOR_PLAYERS,
    GIVING_HINTS,
    VOTING_FOR_LIAR,
    DEFENDING,
    VOTING_FOR_SURVIVAL,
    GUESSING_WORD,
    GAME_OVER
}