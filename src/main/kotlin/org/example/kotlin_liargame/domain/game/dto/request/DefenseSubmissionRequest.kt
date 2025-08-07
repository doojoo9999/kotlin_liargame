package org.example.kotlin_liargame.domain.game.dto.request

data class DefenseSubmissionRequest(
    val playerId: Long,
    val defenseText: String
) {
    fun validate() {
        if (playerId <= 0) {
            throw IllegalArgumentException("플레이어 ID는 양수여야 합니다")
        }
        
        if (defenseText.isBlank()) {
            throw IllegalArgumentException("변론 내용을 입력해 주세요")
        }
        
        if (defenseText.length > 500) {
            throw IllegalArgumentException("변론 내용은 500자를 초과할 수 없습니다")
        }
    }
}