package org.example.kotlin_liargame.domain.game.dto.request

data class JoinGameRequest(
    val gNumber: Int,
    val gPassword: String? = null
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("Game number must be positive")
        }
    }
}
