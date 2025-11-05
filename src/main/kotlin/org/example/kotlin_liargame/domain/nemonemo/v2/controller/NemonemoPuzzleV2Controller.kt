package org.example.kotlin_liargame.domain.nemonemo.v2.controller

import jakarta.validation.Valid
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleCreateRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleReviewRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.service.PuzzleApplicationService
import org.example.kotlin_liargame.global.security.RequireSubject
import org.example.kotlin_liargame.global.security.SubjectPrincipal
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
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
        @RequireSubject subject: SubjectPrincipal,
        @Valid @RequestBody request: PuzzleCreateRequest
    ) = ResponseEntity.status(201).body(
        puzzleApplicationService.createPuzzle(
            request = request,
            authorKey = subject.subjectKey
        )
    )

    @PostMapping("/puzzles/{puzzleId}/review")
    fun reviewPuzzle(
        @PathVariable puzzleId: UUID,
        @RequireSubject subject: SubjectPrincipal,
        @Valid @RequestBody request: PuzzleReviewRequest
    ) = run {
        if (!subject.isAdmin) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN_ONLY")
        }
        ResponseEntity.ok(
            puzzleApplicationService.reviewPuzzle(
                puzzleId = puzzleId,
                reviewerKey = subject.subjectKey,
                request = request
            )
        )
    }

    @PostMapping("/puzzles/{puzzleId}/official")
    fun promoteToOfficial(
        @PathVariable puzzleId: UUID,
        @RequireSubject subject: SubjectPrincipal,
        @Valid @RequestBody request: PuzzleOfficialRequest
    ) = run {
        if (!subject.isAdmin) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN_ONLY")
        }
        ResponseEntity.ok(
            puzzleApplicationService.promoteToOfficial(
                puzzleId = puzzleId,
                reviewerKey = subject.subjectKey,
                request = request
            )
        )
    }

    @PostMapping("/puzzles/{puzzleId}/official/revoke")
    fun revokeOfficial(
        @PathVariable puzzleId: UUID,
        @RequireSubject subject: SubjectPrincipal,
        @Valid @RequestBody request: PuzzleOfficialRequest
    ) = run {
        if (!subject.isAdmin) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN_ONLY")
        }
        ResponseEntity.ok(
            puzzleApplicationService.revokeOfficial(
                puzzleId = puzzleId,
                reviewerKey = subject.subjectKey,
                request = request
            )
        )
    }

    @GetMapping("/daily-picks")
    fun getDailyPicks(
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        date: LocalDate?
    ) = ResponseEntity.ok(
        puzzleApplicationService.getDailyPicks(date ?: LocalDate.now())
    )
}
