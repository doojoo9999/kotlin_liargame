package org.example.kotlin_liargame.domain.nemonemo.controller

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.nemonemo.dto.*
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleLifecycleStatus
import org.example.kotlin_liargame.domain.nemonemo.service.NemonemoPuzzleAdminService
import org.example.kotlin_liargame.domain.nemonemo.service.NemonemoResourceNotFoundException
import org.example.kotlin_liargame.global.security.SessionManagementService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/nemonemo/v1/admin/puzzles")
class NemonemoPuzzleAdminController(
    private val adminService: NemonemoPuzzleAdminService,
    private val sessionManagementService: SessionManagementService
) {

    @GetMapping
    fun listPuzzles(
        session: HttpSession,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) status: PuzzleLifecycleStatus?
    ): AdminPuzzlePageResponse {
        ensureAdmin(session)
        val result = adminService.listPuzzles(page, size, status)
        return AdminPuzzlePageResponse(
            items = result.content,
            page = result.number,
            totalPages = result.totalPages,
            totalItems = result.totalElements
        )
    }

    @GetMapping("/{puzzleId}")
    fun getPuzzle(
        session: HttpSession,
        @PathVariable puzzleId: Long
    ): AdminPuzzleDetailResponse {
        ensureAdmin(session)
        return adminService.getPuzzleDetail(puzzleId)
    }

    @PostMapping
    fun createPuzzle(
        session: HttpSession,
        @RequestBody request: AdminPuzzleUpsertRequest
    ): ResponseEntity<AdminPuzzleDetailResponse> {
        ensureAdmin(session)
        val response = adminService.createPuzzle(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @PutMapping("/{puzzleId}")
    fun updatePuzzle(
        session: HttpSession,
        @PathVariable puzzleId: Long,
        @RequestBody request: AdminPuzzleUpsertRequest
    ): AdminPuzzleDetailResponse {
        ensureAdmin(session)
        return adminService.updatePuzzle(puzzleId, request)
    }

    @PostMapping("/validate")
    fun validatePuzzle(
        session: HttpSession,
        @RequestBody request: AdminPuzzleValidateRequest
    ): AdminPuzzleValidateResponse {
        ensureAdmin(session)
        return adminService.previewValidation(request)
    }

    @ExceptionHandler(NemonemoResourceNotFoundException::class)
    fun handleNotFound(ex: NemonemoResourceNotFoundException): ResponseEntity<Map<String, String>> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("message" to ex.message.orEmpty()))
    }

    private fun ensureAdmin(session: HttpSession) {
        if (!sessionManagementService.isAdmin(session)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN_REQUIRED")
        }
    }
}
