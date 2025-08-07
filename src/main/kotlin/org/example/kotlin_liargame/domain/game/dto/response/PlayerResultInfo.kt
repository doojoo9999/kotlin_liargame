package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.PlayerEntity

data class PlayerResultInfo(
    val id: Long,
    val nickname: String,
    val role: String,
    val isAlive: Boolean,
    val score: Int = 0
) {
    companion object {
        fun from(player: PlayerEntity): PlayerResultInfo {
            return PlayerResultInfo(
                id = player.id,
                nickname = player.nickname,
                role = player.role.name,
                isAlive = player.isAlive,
                score = calculatePlayerScore(player)
            )
        }
        
        private fun calculatePlayerScore(player: PlayerEntity): Int {
            return when {
                player.role.name == "LIAR" && player.isAlive -> 100
                player.role.name == "CITIZEN" && player.isAlive -> 50
                else -> 10
            }
        }
    }
}