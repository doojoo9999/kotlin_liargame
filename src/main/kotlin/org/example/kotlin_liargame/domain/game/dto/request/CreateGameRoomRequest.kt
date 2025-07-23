package org.example.kotlin_liargame.domain.game.dto.request

import org.example.kotlin_liargame.domain.game.model.GameEntity

data class CreateGameRoomRequest(
    val nickname: String,
    val gName: String,
    val gPassword: String? = null,
    val gParticipants: Int = 2
) {
    fun to(gNumber: Int, gParticipants: Int, gOwner: String): GameEntity {
        return GameEntity(
            gNumber = gNumber,
            gName = this.gName,
            gPassword = this.gPassword,
            gParticipants = gParticipants,
            gStatus = true,
            gOwner = gOwner
        )
    }
}