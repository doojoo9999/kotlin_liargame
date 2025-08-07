package org.example.kotlin_liargame.domain.game.dto.request

data class SubmitLiarGuessRequest(
    val gameNumber: Int,
    val guess: String
) {
    fun validate() {
        require(gameNumber > 0) { "Game number must be positive" }
        require(guess.isNotBlank()) { "Guess cannot be empty" }
        require(guess.length <= 50) { "Guess too long (max 50 characters)" }
    }
}