package org.example.kotlin_liargame.domain.game.dto.request

data class GuessWordRequest(
    val gNumber: Int,
    val guess: String
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("Game number must be positive")
        }
        
        if (guess.isBlank()) {
            throw IllegalArgumentException("Guess cannot be empty")
        }
        
        if (guess.length > 100) {
            throw IllegalArgumentException("Guess cannot be longer than 100 characters")
        }
    }
}