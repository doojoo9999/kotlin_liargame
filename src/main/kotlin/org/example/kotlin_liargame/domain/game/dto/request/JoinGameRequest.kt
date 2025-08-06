package org.example.kotlin_liargame.domain.game.dto.request

data class JoinGameRequest(
    val gameNumber: Int,
    val gamePassword: String? = null
) {
    fun validate() {
        if (gameNumber <= 0) {
            throw IllegalArgumentException("Game number must be positive")
        }
    }
}
