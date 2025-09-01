package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.PlayerEntity

data class ScoreboardEntry(
    val playerId: Long,
    val nickname: String,
    val isAlive: Boolean,
    val score: Int
) {
    companion object {
        fun from(player: PlayerEntity): ScoreboardEntry {
            return ScoreboardEntry(
                playerId = player.id,
                nickname = player.nickname,
                isAlive = player.isAlive,
                score = player.cumulativeScore
            )
        }
    }
}