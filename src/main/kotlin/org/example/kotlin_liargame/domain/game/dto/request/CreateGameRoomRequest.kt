package org.example.kotlin_liargame.domain.game.dto.request

import jakarta.validation.constraints.*
import org.example.kotlin_liargame.common.validation.ValidLiarCount
import org.example.kotlin_liargame.common.validation.ValidSubjectConfiguration
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
import org.example.kotlin_liargame.domain.game.model.enum.GameState

@ValidLiarCount
@ValidSubjectConfiguration
data class CreateGameRoomRequest(
    @field:Size(min = 2, max = 20, message = "닉네임은 2자 이상 20자 이하여야 합니다")
    @field:Pattern(
        regexp = "^[가-힣a-zA-Z0-9_-]*$",
        message = "닉네임은 한글, 영문, 숫자, 언더스코어, 하이픈만 사용 가능합니다"
    )
    val nickname: String? = null,
    
    @field:Size(max = 50, message = "게임 이름은 50자 이하여야 합니다")
    val gameName: String? = null,
    
    @field:Size(max = 20, message = "게임 비밀번호는 20자 이하여야 합니다")
    val gamePassword: String? = null,
    
    @field:Min(value = 3, message = "참가자는 최소 3명 이상이어야 합니다")
    @field:Max(value = 15, message = "참가자는 최대 15명 이하여야 합니다")
    val gameParticipants: Int = 5,
    
    @field:Min(value = 1, message = "라운드는 최소 1회 이상이어야 합니다")
    @field:Max(value = 10, message = "라운드는 최대 10회 이하여야 합니다")
    val gameTotalRounds: Int = 3,
    
    @field:Min(value = 1, message = "라이어는 최소 1명 이상이어야 합니다")
    val gameLiarCount: Int = 1,
    
    @field:NotNull(message = "게임 모드는 필수입니다")
    val gameMode: GameMode = GameMode.LIARS_KNOW,
    
    @field:Size(max = 10, message = "주제는 최대 10개까지 선택 가능합니다")
    val subjectIds: List<@Positive(message = "주제 ID는 양수여야 합니다") Long>? = null,
    
    val useRandomSubjects: Boolean = true,
    
    @field:Min(value = 1, message = "랜덤 주제 개수는 최소 1개 이상이어야 합니다")
    @field:Max(value = 5, message = "랜덤 주제 개수는 최대 5개 이하여야 합니다")
    val randomSubjectCount: Int? = 1
) {
    fun getSanitizedGameName(): String? {
        return gameName?.trim()?.takeIf { it.isNotBlank() }
            ?.replace(Regex("[<>\"'&]"), "") // XSS 방지
    }
    
    fun to(gameNumber: Int, gameOwner: String): GameEntity {
        return GameEntity(
            gameNumber = gameNumber,
            gameName = this.gameName?.takeIf { it.isNotBlank() } ?: "${gameOwner}님의 방",
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
