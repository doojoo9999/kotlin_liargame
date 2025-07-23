package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.request.CreateGameRoomRequest
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.tools.security.UserPrincipal
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service

@Service
class GameService (
    private val gameRepository: GameRepository
){


    private fun validateExistingOwner(ownerName: String) {
        if (gameRepository.findBygOwner(ownerName) != null) {
            throw RuntimeException("이미 방장으로 게임을 진행하고 있습니다.")
        }
    }

    private fun findNextAvailableRoomNumber(): Int {
        var roomNumber = 1
        while (gameRepository.findBygNumber(roomNumber) != null) {
            roomNumber++
        }
        return roomNumber
    }

    private fun getCurrentUserNickname(): String {
        val authentication = SecurityContextHolder.getContext().authentication
        return (authentication.principal as UserPrincipal).nickname
    }

    fun createGameRoom(req: CreateGameRoomRequest) {
        validateExistingOwner(req.gName)

        val nextRoomNumber = findNextAvailableRoomNumber()
        val nickname = getCurrentUserNickname()
        val newGame = req.to(nextRoomNumber, req.gParticipants, nickname)
        gameRepository.save(newGame)
    }



}