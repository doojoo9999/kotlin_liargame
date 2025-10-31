package org.example.kotlin_liargame.domain.nemonemo.v2.controller

import jakarta.validation.Valid
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleCreateRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.service.PuzzleApplicationService
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/v2/nemonemo")
class NemonemoPuzzleV2Controller(
    private val puzzleApplicationService: PuzzleApplicationService
) {

    @GetMapping("/puzzles")
    fun listPuzzles(
        @RequestParam(defaultValue = "APPROVED") status: PuzzleStatus,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ) = ResponseEntity.ok(
        puzzleApplicationService.listPuzzles(status = status, page = page, size = size)
    )

    @GetMapping("/puzzles/{puzzleId}")
    fun getPuzzle(
        @PathVariable puzzleId: UUID
    ) = puzzleApplicationService.getPuzzleDetail(puzzleId)?.let { ResponseEntity.ok(it) }
        ?: ResponseEntity.notFound().build()

    @PostMapping("/puzzles")
    fun createPuzzle(
        @RequestHeader("X-Subject-Key", required = false) subjectHeader: UUID?,
        @Valid @RequestBody request: PuzzleCreateRequest
    ) = ResponseEntity.accepted().body(
        puzzleApplicationService.createPuzzle(
            request = request,
            authorKey = subjectHeader
        )
    )

    @GetMapping("/daily-picks")
    fun getDailyPicks(
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        date: LocalDate?
    ) = ResponseEntity.ok(
        puzzleApplicationService.getDailyPicks(date ?: LocalDate.now())
    )
}
