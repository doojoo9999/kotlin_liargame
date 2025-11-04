package org.example.kotlin_liargame.domain.nemonemo.v2.controller

import jakarta.validation.Valid
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.MultiplayerSessionCreateRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.service.MultiplayerOrchestrator
import org.example.kotlin_liargame.global.security.RequireSubject
import org.example.kotlin_liargame.global.security.SubjectPrincipal
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@RestController
@RequestMapping("/api/v2/nemonemo")
class NemonemoMultiplayerV2Controller(
    private val multiplayerOrchestrator: MultiplayerOrchestrator
) {

    @PostMapping("/multiplayer/sessions")
    fun createSession(
        @RequireSubject subject: SubjectPrincipal,
        @Valid @RequestBody request: MultiplayerSessionCreateRequest
    ) = ResponseEntity.status(201).body(
        multiplayerOrchestrator.createSession(subject.subjectKey, request)
    )

    @PostMapping("/multiplayer/sessions/{sessionId}/join")
    fun joinSession(
        @PathVariable sessionId: UUID,
        @RequireSubject subject: SubjectPrincipal
    ) = ResponseEntity.ok(
        multiplayerOrchestrator.joinSession(sessionId, subject.subjectKey)
    )

    @PostMapping("/multiplayer/sessions/{sessionId}/ready/{subjectKey}")
    fun updateReady(
        @PathVariable sessionId: UUID,
        @PathVariable subjectKey: UUID,
        @RequireSubject actor: SubjectPrincipal,
        @RequestHeader("X-Ready-State") readyState: Boolean
    ) = ResponseEntity.ok(
        when {
            actor.subjectKey == subjectKey || actor.isAdmin ->
                multiplayerOrchestrator.updateReadyState(sessionId, subjectKey, readyState)
            else -> throw ResponseStatusException(HttpStatus.FORBIDDEN, "SUBJECT_MISMATCH")
        }
    )
}
