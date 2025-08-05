package org.example.kotlin_liargame.domain.game.dto.request

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
import org.example.kotlin_liargame.domain.game.model.enum.GameState

data class CreateGameRoomRequest(
    val nickname: String? = null,
    val gameName: String,
    val gamePassword: String? = null,
    val gameParticipants: Int = 5,
    val gameTotalRounds: Int = 3,
    val gameLiarCount: Int = 1,
    val gameMode: GameMode = GameMode.LIARS_KNOW,
    val subjectIds: List<Long>? = null,
    val useRandomSubjects: Boolean = true,
    val randomSubjectCount: Int? = 1
) {
    fun validate() {
        if (gameParticipants < 3 || gameParticipants > 15) {
            throw IllegalArgumentException("참가자는 3명에서 15명 이하여야 합니다")
        }

        if (gameLiarCount < 1 || gameLiarCount >= gameParticipants) {
            throw IllegalArgumentException("라이어는 1명에서 ${gameParticipants - 1}명 이하여야 합니다")
        }

        if (gameTotalRounds < 1) {
            throw IllegalArgumentException("라운드는 최소 1회 이상이어야 합니다")
        }
    }
    
    fun to(gameNumber: Int, gameOwner: String): GameEntity {
        return GameEntity(
            gameNumber = gameNumber,
            gameName = this.gameName,
            gamePassword = this.gamePassword,
            gameParticipants = this.gameParticipants,
            gameTotalRounds = this.gameTotalRounds,
            gameCurrentRound = 0,
            gameLiarCount = this.gameLiarCount,
            gameMode = this.gameMode,
            gameState = GameState.WAITING,
            gameOwner = gameOwner,
            citizenSubject = null,
            liarSubject = null
        )
    }
}
