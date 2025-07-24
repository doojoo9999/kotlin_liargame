package org.example.kotlin_liargame.domain.game.dto.request

data class StartGameRequest(
    val gNumber: Int,
    val subjectId: Long? = null
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("Game number must be positive")
        }
        
        if (subjectId != null && subjectId <= 0) {
            throw IllegalArgumentException("Subject ID must be positive")
        }
    }
}