package org.example.kotlin_liargame.domain.game.dto.request

data class GiveHintRequest(
    val gameNumber: Int,
    val hint: String
) {
    fun validate() {
        if (gameNumber <= 0) {
            throw IllegalArgumentException("게임 번호는 양수여야 합니다")
        }
        
        if (hint.isBlank()) {
            throw IllegalArgumentException("힌트는 비어 있을 수 없습니다")
        }
        
        if (hint.length > 200) {
            throw IllegalArgumentException("힌트는 200자를 초과할 수 없습니다")
        }
    }
}
