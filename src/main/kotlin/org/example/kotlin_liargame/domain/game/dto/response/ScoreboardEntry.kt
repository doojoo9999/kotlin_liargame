package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.PlayerEntity

data class ScoreboardEntry(
    val userId: Long,
    val nickname: String,
    val isAlive: Boolean,
    val score: Int
) {
    companion object {
        fun from(player: PlayerEntity): ScoreboardEntry {
            return ScoreboardEntry(
                userId = player.userId,
                nickname = player.nickname,
                isAlive = player.isAlive,
                score = player.cumulativeScore
            )
        }
    }
}