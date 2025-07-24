package org.example.kotlin_liargame.domain.game.dto.request

data class GuessWordRequest(
    val gNumber: Int,
    val guess: String
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("���� ��ȣ�� ������� �մϴ�")
        }
        
        if (guess.isBlank()) {
            throw IllegalArgumentException("���� �ܾ�� ��� ���� �� �����ϴ�")
        }
        
        if (guess.length > 100) {
            throw IllegalArgumentException("���� �ܾ�� 100�ڸ� �ʰ��� �� �����ϴ�")
        }
    }
}