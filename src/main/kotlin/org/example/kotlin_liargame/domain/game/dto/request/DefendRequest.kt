package org.example.kotlin_liargame.domain.game.dto.request

data class DefendRequest(
    val gNumber: Int,
    val defense: String
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("Game number must be positive")
        }
        
        if (defense.isBlank()) {
            throw IllegalArgumentException("Defense cannot be empty")
        }
        
        if (defense.length > 200) {
            throw IllegalArgumentException("Defense cannot be longer than 200 characters")
        }
    }
}