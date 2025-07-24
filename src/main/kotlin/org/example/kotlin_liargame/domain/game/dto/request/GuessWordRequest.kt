package org.example.kotlin_liargame.domain.game.dto.request

data class GuessWordRequest(
    val gNumber: Int,
    val guess: String
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("게임 번호는 양수여야 합니다")
        }
        
        if (guess.isBlank()) {
            throw IllegalArgumentException("추측 단어는 비어 있을 수 없습니다")
        }
        
        if (guess.length > 100) {
            throw IllegalArgumentException("추측 단어는 100자를 초과할 수 없습니다")
        }
    }
}