package org.example.kotlin_liargame.domain.game.controller

import org.example.kotlin_liargame.domain.game.dto.request.*
import org.example.kotlin_liargame.domain.game.dto.response.GameResultResponse
import org.example.kotlin_liargame.domain.game.dto.response.GameRoomListResponse
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.service.GameService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/game")
class GameController(
    private val gameService: GameService
) {
    
    @PostMapping("/create")
    fun createGameRoom(@RequestBody request: CreateGameRoomRequest): ResponseEntity<Int> {
        val gameNumber = gameService.createGameRoom(request)
        return ResponseEntity.ok(gameNumber)
    }
    
    @PostMapping("/join")
    fun joinGame(@RequestBody request: JoinGameRequest): ResponseEntity<GameStateResponse> {
        val response = gameService.joinGame(request)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/start")
    fun startGame(@RequestBody request: StartGameRequest): ResponseEntity<GameStateResponse> {
        val response = gameService.startGame(request)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/hint")
    fun giveHint(@RequestBody request: GiveHintRequest): ResponseEntity<GameStateResponse> {
        val response = gameService.giveHint(request)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/vote")
    fun vote(@RequestBody request: VoteRequest): ResponseEntity<GameStateResponse> {
        val response = gameService.vote(request)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/defend")
    fun defend(@RequestBody request: DefendRequest): ResponseEntity<GameStateResponse> {
        val response = gameService.defend(request)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/survival-vote")
    fun survivalVote(@RequestBody request: SurvivalVoteRequest): ResponseEntity<GameStateResponse> {
        val response = gameService.survivalVote(request)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/guess-word")
    fun guessWord(@RequestBody request: GuessWordRequest): ResponseEntity<GameResultResponse> {
        val response = gameService.guessWord(request)
        return ResponseEntity.ok(response)
    }
    
    @GetMapping("/{gNumber}")
    fun getGameState(@PathVariable gNumber: Int): ResponseEntity<GameStateResponse> {
        val response = gameService.getGameState(gNumber)
        return ResponseEntity.ok(response)
    }
    
    @GetMapping("/result/{gNumber}")
    fun getGameResult(@PathVariable gNumber: Int): ResponseEntity<GameResultResponse> {
        val response = gameService.getGameResult(gNumber)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/end-of-round")
    fun endOfRound(@RequestBody request: EndOfRoundRequest): ResponseEntity<GameStateResponse> {
        val response = gameService.endOfRound(request)
        return ResponseEntity.ok(response)
    }
    
    @GetMapping("/rooms")
    fun getAllGameRooms(): ResponseEntity<GameRoomListResponse> {
        val response = gameService.getAllGameRooms()
        return ResponseEntity.ok(response)
    }
}