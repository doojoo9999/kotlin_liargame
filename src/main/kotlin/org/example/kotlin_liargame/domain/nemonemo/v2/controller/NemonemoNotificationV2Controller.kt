package org.example.kotlin_liargame.domain.nemonemo.v2.controller

import org.example.kotlin_liargame.domain.nemonemo.v2.dto.GameSettingDto
import org.example.kotlin_liargame.domain.nemonemo.v2.service.NotificationCenterService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
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
        @RequestHeader("X-Subject-Key") subjectKey: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ) = ResponseEntity.ok(
        notificationCenterService.fetchNotifications(subjectKey, page, size)
    )

    @PatchMapping("/notifications/{notificationId}")
    fun markNotification(
        @RequestHeader("X-Subject-Key") subjectKey: UUID,
        @PathVariable notificationId: UUID
    ): ResponseEntity<Void> {
        notificationCenterService.markAsRead(subjectKey, notificationId)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/settings")
    fun getSettings(
        @RequestHeader("X-Subject-Key") subjectKey: UUID
    ): ResponseEntity<GameSettingDto> =
        notificationCenterService.getSettings(subjectKey)?.let { ResponseEntity.ok(it) }
            ?: ResponseEntity.notFound().build()

    @PostMapping("/settings")
    fun upsertSettings(
        @RequestHeader("X-Subject-Key") subjectKey: UUID,
        @RequestBody settings: Map<String, Any>
    ): ResponseEntity<Void> {
        notificationCenterService.upsertSettings(subjectKey, settings)
        return ResponseEntity.noContent().build()
    }
}
