package org.example.kotlin_liargame.domain.game.controller

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.game.dto.request.*
import org.example.kotlin_liargame.domain.game.dto.response.GameResultResponse
import org.example.kotlin_liargame.domain.game.dto.response.GameRoomListResponse
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.service.GameProgressService
import org.example.kotlin_liargame.domain.game.service.GameService
import org.springframework.http.ResponseEntity
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/game")
class GameController(
    private val gameService: GameService,
    private val gameProgressService: GameProgressService,
    private val messagingTemplate: SimpMessagingTemplate
) {
    
    @PostMapping("/create")
    fun createGameRoom(@RequestBody request: CreateGameRoomRequest, session: HttpSession): ResponseEntity<Int> {
        val gameNumber = gameService.createGameRoom(request, session)
        return ResponseEntity.ok(gameNumber)
    }

    @PostMapping("/join")
    fun joinGame(@RequestBody request: JoinGameRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        try {
            val response = gameService.joinGame(request, session)

            messagingTemplate.convertAndSend("/topic/room.${request.gameNumber}", mapOf(
                "type" to "PLAYER_JOINED",
                "gameState" to response,
                "gameNumber" to request.gameNumber
            ))

            messagingTemplate.convertAndSend("/topic/lobby", mapOf(
                "type" to "ROOM_UPDATED",
                "gameNumber" to request.gameNumber
            ))

            return ResponseEntity.ok(response)
        } catch (e: Exception) {
            println("[ERROR] Failed to join game: ${e.message}")
            return ResponseEntity.badRequest().body(null)
        }
    }


    @PostMapping("/leave")
    fun leaveGame(@RequestBody request: LeaveGameRequest, session: HttpSession): ResponseEntity<Boolean> {
        try {
            val response = gameService.leaveGame(request, session)

            messagingTemplate.convertAndSend("/topic/room.${request.gameNumber}", mapOf(
                "type" to "PLAYER_LEFT",
                "gameNumber" to request.gameNumber
            ))

            messagingTemplate.convertAndSend("/topic/lobby", mapOf(
                "type" to "ROOM_UPDATED",
                "gameNumber" to request.gameNumber
            ))

            return ResponseEntity.ok(response)
        } catch (e: Exception) {
            println("[ERROR] Failed to leave game: ${e.message}")
            return ResponseEntity.badRequest().body(null)
        }
    }

    
    @PostMapping("/start")
    fun startGame(@RequestBody request: StartGameRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        return try {
            // 기존 게임 시작 로직
            val gameState = gameService.startGame(request, session)
            
            // 새로운 게임 진행 로직 추가
            gameProgressService.initializeGameProgress(gameState.gameNumber)
            
            ResponseEntity.ok(gameState)
        } catch (e: Exception) {
            println("[ERROR] Failed to start game: ${e.message}")
            ResponseEntity.badRequest().body(null)
        }
    }
    
    @PostMapping("/hint")
    fun giveHint(@RequestBody request: GiveHintRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = gameService.giveHint(request, session)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/vote")
    fun vote(@RequestBody request: VoteRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = gameService.vote(request, session)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/defend")
    fun defend(@RequestBody request: DefendRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = gameService.defend(request, session)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/survival-vote")
    fun survivalVote(@RequestBody request: SurvivalVoteRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = gameService.survivalVote(request, session)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/guess-word")
    fun guessWord(@RequestBody request: GuessWordRequest, session: HttpSession): ResponseEntity<GameResultResponse> {
        val response = gameService.guessWord(request, session)
        return ResponseEntity.ok(response)
    }
    
    @GetMapping("/{gameNumber}")
    fun getGameState(@PathVariable gameNumber: Int, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = gameService.getGameState(gameNumber, session)
        return ResponseEntity.ok(response)
    }
    
    @GetMapping("/result/{gameNumber}")
    fun getGameResult(@PathVariable gameNumber: Int, session: HttpSession): ResponseEntity<GameResultResponse> {
        val response = gameService.getGameResult(gameNumber, session)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/end-of-round")
    fun endOfRound(@RequestBody request: EndOfRoundRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = gameService.endOfRound(request, session)
        return ResponseEntity.ok(response)
    }
    
    @GetMapping("/rooms")
    fun getAllGameRooms(session: HttpSession): ResponseEntity<GameRoomListResponse> {
        val response = gameService.getAllGameRooms(session)
        return ResponseEntity.ok(response)
    }
}
