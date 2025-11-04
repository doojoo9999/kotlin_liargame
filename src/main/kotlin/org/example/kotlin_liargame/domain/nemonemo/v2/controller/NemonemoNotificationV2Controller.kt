package org.example.kotlin_liargame.domain.nemonemo.v2.controller

import org.example.kotlin_liargame.domain.nemonemo.v2.dto.GameSettingDto
import org.example.kotlin_liargame.domain.nemonemo.v2.service.NotificationCenterService
import org.example.kotlin_liargame.global.security.RequireSubject
import org.example.kotlin_liargame.global.security.SubjectPrincipal
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v2/nemonemo")
class NemonemoNotificationV2Controller(
    private val notificationCenterService: NotificationCenterService
) {

    @GetMapping("/notifications")
    fun notifications(
        @RequireSubject subject: SubjectPrincipal,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ) = ResponseEntity.ok(
        notificationCenterService.fetchNotifications(subject.subjectKey, page, size)
    )

    @PatchMapping("/notifications/{notificationId}")
    fun markNotification(
        @RequireSubject subject: SubjectPrincipal,
        @PathVariable notificationId: UUID
    ): ResponseEntity<Void> {
        notificationCenterService.markAsRead(subject.subjectKey, notificationId)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/settings")
    fun getSettings(
        @RequireSubject subject: SubjectPrincipal
    ): ResponseEntity<GameSettingDto> =
        notificationCenterService.getSettings(subject.subjectKey)?.let { ResponseEntity.ok(it) }
            ?: ResponseEntity.notFound().build()

    @PostMapping("/settings")
    fun upsertSettings(
        @RequireSubject subject: SubjectPrincipal,
        @RequestBody settings: Map<String, Any>
    ): ResponseEntity<Void> {
        notificationCenterService.upsertSettings(subject.subjectKey, settings)
        return ResponseEntity.noContent().build()
    }
}
