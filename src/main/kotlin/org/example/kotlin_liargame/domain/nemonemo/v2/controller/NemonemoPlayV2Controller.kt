package org.example.kotlin_liargame.domain.nemonemo.v2.controller

import jakarta.validation.Valid
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayAutosaveRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayStartRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlaySubmitRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.service.PlaySessionService
import org.example.kotlin_liargame.global.security.RequireSubject
import org.example.kotlin_liargame.global.security.SubjectPrincipal
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v2/nemonemo")
class NemonemoPlayV2Controller(
    private val playSessionService: PlaySessionService
) {

    @PostMapping("/puzzles/{puzzleId}/plays")
    fun startPlay(
        @PathVariable puzzleId: UUID,
        @RequireSubject subject: SubjectPrincipal,
        @Valid @RequestBody request: PlayStartRequest
    ) = ResponseEntity.ok(
        playSessionService.startPlay(puzzleId, subject.subjectKey, request)
    )

    @PostMapping("/plays/{playId}/autosave")
    fun autosave(
        @PathVariable playId: UUID,
        @Valid @RequestBody request: PlayAutosaveRequest
    ): ResponseEntity<Void> {
        playSessionService.autosave(playId, request)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/plays/{playId}/submit")
    fun submit(
        @PathVariable playId: UUID,
        @RequireSubject subject: SubjectPrincipal,
        @Valid @RequestBody request: PlaySubmitRequest
    ) = ResponseEntity.ok(
        playSessionService.submit(playId, subject.subjectKey, request)
    )
}
