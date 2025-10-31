package org.example.kotlin_liargame.domain.nemonemo.v2.controller

import jakarta.validation.Valid
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.MultiplayerSessionCreateRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.service.MultiplayerOrchestrator
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v2/nemonemo")
class NemonemoMultiplayerV2Controller(
    private val multiplayerOrchestrator: MultiplayerOrchestrator
) {

    @PostMapping("/multiplayer/sessions")
    fun createSession(
        @RequestHeader("X-Subject-Key") subjectKey: UUID,
        @Valid @RequestBody request: MultiplayerSessionCreateRequest
    ) = ResponseEntity.status(201).body(
        multiplayerOrchestrator.createSession(subjectKey, request)
    )

    @PostMapping("/multiplayer/sessions/{sessionId}/join")
    fun joinSession(
        @PathVariable sessionId: UUID,
        @RequestHeader("X-Subject-Key") subjectKey: UUID
    ) = ResponseEntity.ok(
        multiplayerOrchestrator.joinSession(sessionId, subjectKey)
    )

    @PostMapping("/multiplayer/sessions/{sessionId}/ready/{subjectKey}")
    fun updateReady(
        @PathVariable sessionId: UUID,
        @PathVariable subjectKey: UUID,
        @RequestHeader("X-Ready-State") readyState: Boolean
    ) = ResponseEntity.ok(
        multiplayerOrchestrator.updateReadyState(sessionId, subjectKey, readyState)
    )
}
