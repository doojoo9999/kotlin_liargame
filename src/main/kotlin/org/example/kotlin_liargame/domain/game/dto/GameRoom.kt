package org.example.kotlin_liargame.domain.game.dto

import org.example.kotlin_liargame.domain.game.model.GameStatus

data class GameRoom(
    val roomId: String,
    var status: GameStatus = GameStatus.WAITING,
    val players: MutableList<String> = mutableListOf(),
    var topic: String,
    var civilianWord: String? = null,
    var liarWord: String? = null,
    var currentPlayerIndex: Int = 0,
    val roundData: MutableList<RoundData> = mutableListOf()
) {
    fun startGame() {
        require(players.size >= 3) { "������ �����Ϸ��� �ּ� 3���� �÷��̾ �ʿ��մϴ�." }
        status = GameStatus.HINT_TURN
        GameSetupManager.distributeRoles(players)
        currentPlayerIndex = (0 until players.size).random()
    }

    fun moveToNextState() {
        status = when (status) {
            GameStatus.HINT_TURN -> GameStatus.FIRST_VOTE
            GameStatus.FIRST_VOTE -> GameStatus.DEFENSE_TIME
            GameStatus.DEFENSE_TIME -> GameStatus.FINAL_VOTE
            GameStatus.FINAL_VOTE -> GameStatus.HINT_TURN
            GameStatus.GAME_OVER -> GameStatus.GAME_OVER
            GameStatus.WAITING -> GameStatus.HINT_TURN
        }
    }

    fun announceResults() {
        require(status == GameStatus.GAME_OVER) { "������ ���� ������� �ʾҽ��ϴ�." }
        // ��� ó�� ����
    }
}
