package org.example.kotlin_liargame.domain.nemonemo.controller

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.nemonemo.dto.PuzzleDetailResponse
import org.example.kotlin_liargame.domain.nemonemo.dto.PuzzlePageResponse
import org.example.kotlin_liargame.domain.nemonemo.dto.SessionActionRequestDto
import org.example.kotlin_liargame.domain.nemonemo.dto.SessionCompletionRequestDto
import org.example.kotlin_liargame.domain.nemonemo.dto.SessionCompletionResponseDto
import org.example.kotlin_liargame.domain.nemonemo.dto.SessionResponseDto
import org.example.kotlin_liargame.domain.nemonemo.dto.SessionStartRequestDto
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleDifficulty
import org.example.kotlin_liargame.domain.nemonemo.service.NemonemoPuzzleService
import org.example.kotlin_liargame.domain.nemonemo.service.NemonemoResourceNotFoundException
import org.example.kotlin_liargame.domain.nemonemo.service.NemonemoSessionService
import org.example.kotlin_liargame.domain.nemonemo.service.NemonemoUnauthorizedException
import org.example.kotlin_liargame.global.security.SessionManagementService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/nemonemo/v1")
@Validated
class NemonemoPuzzleController(
    private val puzzleService: NemonemoPuzzleService,
    private val sessionService: NemonemoSessionService,
    private val sessionManagementService: SessionManagementService
) {

    @GetMapping("/puzzles")
    fun getPuzzles(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) difficulty: PuzzleDifficulty?,
        @RequestParam(required = false) releasePack: String?
    ): PuzzlePageResponse {
        return puzzleService.getPuzzles(
            page = page,
            size = size,
            difficulty = difficulty,
            releasePack = releasePack
        )
    }

    @GetMapping("/puzzles/{puzzleId}")
    fun getPuzzleDetail(
        @PathVariable puzzleId: Long
    ): ResponseEntity<PuzzleDetailResponse> {
        val detail = puzzleService.getPuzzleDetail(puzzleId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(detail)
    }

    @PostMapping("/sessions")
    fun startSession(
        session: HttpSession,
        @RequestBody request: SessionStartRequestDto
    ): SessionResponseDto {
        val userId = sessionManagementService.getUserId(session)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED")
        return sessionService.startSession(userId = userId, request = request)
    }

    @GetMapping("/sessions/{sessionId}")
    fun getSession(
        @PathVariable sessionId: Long
    ): SessionResponseDto {
        return sessionService.getSession(sessionId)
    }

    @PostMapping("/sessions/{sessionId}/actions")
    fun postActions(
        @PathVariable sessionId: Long,
        @RequestBody request: SessionActionRequestDto
    ): ResponseEntity<Void> {
        sessionService.applyActions(sessionId, request)
        return ResponseEntity.status(HttpStatus.ACCEPTED).build()
    }

    @PostMapping("/sessions/{sessionId}/complete")
    fun completeSession(
        session: HttpSession,
        @PathVariable sessionId: Long,
        @RequestBody request: SessionCompletionRequestDto
    ): SessionCompletionResponseDto {
        val userId = sessionManagementService.getUserId(session)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED")
        return sessionService.completeSession(userId, sessionId, request)
    }

    @ExceptionHandler(NemonemoResourceNotFoundException::class)
    fun handleNotFound(ex: NemonemoResourceNotFoundException): ResponseEntity<Map<String, String>> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("message" to ex.message.orEmpty()))
    }

    @ExceptionHandler(NemonemoUnauthorizedException::class)
    fun handleUnauthorized(ex: NemonemoUnauthorizedException): ResponseEntity<Map<String, String>> {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(mapOf("message" to ex.message.orEmpty()))
    }
}
