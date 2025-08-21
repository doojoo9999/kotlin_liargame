package org.example.kotlin_liargame.domain.game.model.enum

enum class PlayerState {
    WAITING_FOR_HINT,
    GAVE_HINT,
    WAITING_FOR_VOTE,
    VOTED,
    ACCUSED,
    DEFENDED,
    WAITING_FOR_FINAL_VOTE,
    FINAL_VOTED,
    SURVIVED,
    ELIMINATED,
    DISCONNECTED
}
