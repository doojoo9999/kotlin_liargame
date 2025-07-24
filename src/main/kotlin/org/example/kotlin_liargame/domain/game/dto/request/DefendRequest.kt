package org.example.kotlin_liargame.domain.game.dto.request

data class DefendRequest(
    val gNumber: Int,
    val defense: String
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("���� ��ȣ�� ������� �մϴ�")
        }
        
        if (defense.isBlank()) {
            throw IllegalArgumentException("���� ������ ��� ���� �� �����ϴ�")
        }
        
        if (defense.length > 200) {
            throw IllegalArgumentException("���� ������ 200�ڸ� �ʰ��� �� �����ϴ�")
        }
    }
}