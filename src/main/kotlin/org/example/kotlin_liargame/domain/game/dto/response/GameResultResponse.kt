package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.PlayerRole
import org.example.kotlin_liargame.domain.game.model.enum.WinningTeam

data class GameResultResponse(
    val gameNumber: Int,
    val gameName: String,
    val winningTeam: WinningTeam,
    val citizenWord: String,
    val liarWord: String?,
    val citizens: List<PlayerResponse>,
    val liars: List<PlayerResponse>,
    val rounds: Int,
    val correctGuess: Boolean? = null
) {
    companion object {
        fun from(
            game: GameEntity,
            players: List<PlayerEntity>,
            winningTeam: WinningTeam,
            correctGuess: Boolean? = null
        ): GameResultResponse {
            val citizens = players.filter { it.role == PlayerRole.CITIZEN }
            val liars = players.filter { it.role == PlayerRole.LIAR }
            
            return GameResultResponse(
                gameNumber = game.gameNumber,
                gameName = game.gameName,
                winningTeam = winningTeam,
                citizenWord = game.citizenSubject?.content ?: "Unknown",
                liarWord = game.liarSubject?.content,
                citizens = citizens.map { PlayerResponse.from(it) },
                liars = liars.map { PlayerResponse.from(it) },
                rounds = game.gameCurrentRound,
                correctGuess = correctGuess
            )
        }
    }
}
