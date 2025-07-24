package org.example.kotlin_liargame.domain.game.dto.request

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
import org.example.kotlin_liargame.domain.game.model.enum.GameState

data class CreateGameRoomRequest(
    val nickname: String,
    val gName: String,
    val gPassword: String? = null,
    val gParticipants: Int = 5,
    val gTotalRounds: Int = 3,
    val gLiarCount: Int = 1,
    val gGameMode: GameMode = GameMode.LIARS_KNOW
) {
    fun validate() {
        if (gParticipants < 3 || gParticipants > 15) {
            throw IllegalArgumentException("������ ���� 3���� 15�� ���̿��� �մϴ�")
        }
        
        if (gLiarCount < 1 || gLiarCount >= gParticipants) {
            throw IllegalArgumentException("���̾� ���� 1���� ${gParticipants - 1}�� ���̿��� �մϴ�")
        }
        
        if (gTotalRounds < 1) {
            throw IllegalArgumentException("���� ���� �ּ� 1ȸ �̻��̾�� �մϴ�")
        }
    }
    
    fun to(gNumber: Int, gOwner: String): GameEntity {
        return GameEntity(
            gNumber = gNumber,
            gName = this.gName,
            gPassword = this.gPassword,
            gParticipants = this.gParticipants,
            gTotalRounds = this.gTotalRounds,
            gCurrentRound = 0,
            gLiarCount = this.gLiarCount,
            gGameMode = this.gGameMode,
            gState = GameState.WAITING,
            gOwner = gOwner,
            citizenSubject = null,
            liarSubject = null
        )
    }
}