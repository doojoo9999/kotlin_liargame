package org.example.kotlin_liargame.domain.nemonemo.v2.controller

import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import org.example.kotlin_liargame.domain.nemonemo.v2.service.LeaderboardService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v2/nemonemo")
class NemonemoLeaderboardV2Controller(
    private val leaderboardService: LeaderboardService
) {

    @GetMapping("/puzzles/{puzzleId}/leaderboard")
    fun puzzleLeaderboard(
        @PathVariable puzzleId: UUID,
        @RequestParam(defaultValue = "NORMAL") mode: PuzzleMode
    ) = ResponseEntity.ok(
        leaderboardService.fetchPuzzleLeaderboard(puzzleId, mode)
    )

    @GetMapping("/leaderboard/global")
    fun globalLeaderboard() = ResponseEntity.ok(
        leaderboardService.fetchRecentGlobalLeaderboard()
    )
}
