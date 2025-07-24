package org.example.kotlin_liargame.domain.game.dto.request

data class VoteRequest(
    val gNumber: Int,
    val targetPlayerId: Long
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("���� ��ȣ�� ������� �մϴ�")
        }
        
        if (targetPlayerId <= 0) {
            throw IllegalArgumentException("��� �÷��̾� ID�� ������� �մϴ�")
        }
    }
}