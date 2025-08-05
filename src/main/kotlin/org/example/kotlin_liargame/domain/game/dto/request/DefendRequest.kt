package org.example.kotlin_liargame.domain.game.dto.request

data class DefendRequest(
    val gameNumber: Int,
    val defense: String
) {
    fun validate() {
        if (gameNumber <= 0) {
            throw IllegalArgumentException("게임 번호는 양수여야 합니다")
        }
        
        if (defense.isBlank()) {
            throw IllegalArgumentException("변론 내용은 비어 있을 수 없습니다")
        }
        
        if (defense.length > 200) {
            throw IllegalArgumentException("변론 내용은 200자를 초과할 수 없습니다")
        }
    }
}
