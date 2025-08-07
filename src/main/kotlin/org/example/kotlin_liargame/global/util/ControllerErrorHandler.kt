package org.example.kotlin_liargame.global.util

import org.example.kotlin_liargame.domain.game.dto.response.DefenseSubmissionResponse
import org.example.kotlin_liargame.domain.game.dto.response.FinalVoteResponse
import org.example.kotlin_liargame.domain.game.dto.response.LiarGuessResultResponse
import org.example.kotlin_liargame.domain.game.dto.response.VoteResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

@Component
class ControllerErrorHandler {

    fun createDefenseErrorResponse(
        gameNumber: Int,
        status: HttpStatus,
        message: String
    ): ResponseEntity<DefenseSubmissionResponse> {
        return ResponseEntity.status(status).body(
            DefenseSubmissionResponse(
                gameNumber = gameNumber,
                playerId = 0L,
                playerNickname = "",
                defenseText = "",
                success = false,
                message = message
            )
        )
    }

    fun createFinalVoteErrorResponse(
        gameNumber: Int,
        status: HttpStatus,
        message: String
    ): ResponseEntity<FinalVoteResponse> {
        return ResponseEntity.status(status).body(
            FinalVoteResponse(
                gameNumber = gameNumber,
                voterPlayerId = 0L,
                voterNickname = "",
                voteForExecution = false,
                success = false,
                message = message
            )
        )
    }

    fun createLiarGuessErrorResponse(
        gameNumber: Int,
        guess: String = "",
        status: HttpStatus,
        message: String
    ): ResponseEntity<LiarGuessResultResponse> {
        return ResponseEntity.status(status).body(
            LiarGuessResultResponse(
                gameNumber = gameNumber,
                liarGuess = guess,
                correctAnswer = "",
                isCorrect = false,
                winner = "CITIZENS",
                gameEnd = true
            )
        )
    }

    fun createVoteErrorResponse(
        status: HttpStatus,
        message: String
    ): ResponseEntity<VoteResponse> {
        return ResponseEntity.status(status).body(
            VoteResponse("", "", false, message)
        )
    }

    fun createUnauthorizedResponse(): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
            mapOf("error" to "Not authenticated")
        )
    }

    fun getStatusForException(exception: Exception): HttpStatus {
        return when (exception) {
            is IllegalArgumentException -> HttpStatus.BAD_REQUEST
            is IllegalStateException -> HttpStatus.BAD_REQUEST
            else -> HttpStatus.INTERNAL_SERVER_ERROR
        }
    }

    fun getMessageForException(exception: Exception, operation: String): String {
        return when (exception) {
            is IllegalArgumentException -> "Invalid request: ${exception.message}"
            is IllegalStateException -> "Game state error: ${exception.message}"
            else -> "$operation failed: ${exception.message}"
        }
    }
}