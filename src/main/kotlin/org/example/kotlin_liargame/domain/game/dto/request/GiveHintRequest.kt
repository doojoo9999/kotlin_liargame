package org.example.kotlin_liargame.domain.game.dto.request

data class GiveHintRequest(
    val gNumber: Int,
    val hint: String
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("���� ��ȣ�� ������� �մϴ�")
        }
        
        if (hint.isBlank()) {
            throw IllegalArgumentException("��Ʈ�� ��� ���� �� �����ϴ�")
        }
        
        if (hint.length > 200) {
            throw IllegalArgumentException("��Ʈ�� 200�ڸ� �ʰ��� �� �����ϴ�")
        }
    }
}