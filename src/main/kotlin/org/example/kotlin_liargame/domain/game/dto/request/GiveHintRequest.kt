package org.example.kotlin_liargame.domain.game.dto.request

data class GiveHintRequest(
    val gNumber: Int,
    val hint: String
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("Game number must be positive")
        }
        
        if (hint.isBlank()) {
            throw IllegalArgumentException("Hint cannot be empty")
        }
        
        if (hint.length > 200) {
            throw IllegalArgumentException("Hint cannot be longer than 200 characters")
        }
    }
}