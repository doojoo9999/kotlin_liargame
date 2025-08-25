package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.model.PlayerEntity

data class PlayerResponse(
    val id: Long,
    val nickname: String,
    val isAlive: Boolean,
    val state: String,
    val hint: String? = null,
    val defense: String? = null,
    val votesReceived: Int? = null,
    val hasVoted: Boolean = false
) {
    companion object {
        fun from(player: PlayerEntity): PlayerResponse {
            return PlayerResponse(
                id = player.id,
                nickname = player.nickname,
                isAlive = player.isAlive,
                state = player.state.name,
                hint = player.hint,
                defense = player.defense,
                votesReceived = player.votesReceived,
                hasVoted = player.hasVoted
            )
        }
    }
}

