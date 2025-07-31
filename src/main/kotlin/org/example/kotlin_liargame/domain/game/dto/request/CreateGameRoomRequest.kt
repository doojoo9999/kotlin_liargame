package org.example.kotlin_liargame.domain.game.dto.request

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
import org.example.kotlin_liargame.domain.game.model.enum.GameState

data class CreateGameRoomRequest(
    val nickname: String? = null,
    val gName: String,
    val gPassword: String? = null,
    val gParticipants: Int = 5,
    val gTotalRounds: Int = 3,
    val gLiarCount: Int = 1,
    val gGameMode: GameMode = GameMode.LIARS_KNOW,
    val subjectIds: List<Long>? = null,
    val useRandomSubjects: Boolean = true,
    val randomSubjectCount: Int? = 1
) {
    fun validate() {
        if (gParticipants < 3 || gParticipants > 15) {
            throw IllegalArgumentException("ì°¸ê????˜ëŠ” 3ëª…ì—??15ëª??¬ì´?¬ì•¼ ?©ë‹ˆ??)
        }
        
        if (gLiarCount < 1 || gLiarCount >= gParticipants) {
            throw IllegalArgumentException("?¼ì´???˜ëŠ” 1ëª…ì—??${gParticipants - 1}ëª??¬ì´?¬ì•¼ ?©ë‹ˆ??)
        }
        
        if (gTotalRounds < 1) {
            throw IllegalArgumentException("?¼ìš´???˜ëŠ” ìµœì†Œ 1???´ìƒ?´ì–´???©ë‹ˆ??)
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
