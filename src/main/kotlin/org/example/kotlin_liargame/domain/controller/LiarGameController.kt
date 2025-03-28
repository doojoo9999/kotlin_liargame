package org.example.kotlin_liargame.domain.controller

import org.example.kotlin_liargame.domain.entity.MemberEntity
import org.example.kotlin_liargame.domain.service.LiarGameService
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/games")
class LiarGameController (private val liarGameService: LiarGameService) {
    @PostMapping
    fun createGame(@RequestBody players : List<MemberEntity>, @RequestParam topicId: Long) : ResponseEntity<Unit>
    = ResponseEntity.ok().body(liarGameService.createGame(players, topicId))

    @PostMapping("/{gameId}/kill")
    fun killPlayer(@PathVariable gameId : Long, @RequestParam playerId:Long) {
        liarGameService.voteToKill(gameId, playerId)
    }

    @PostMapping("/{gameId}/guess")
    fun guessAnswer (@PathVariable gameId : Long, @RequestParam guess:String) : Boolean {
        return liarGameService.checkLiarGuess(gameId,guess)
    }

}