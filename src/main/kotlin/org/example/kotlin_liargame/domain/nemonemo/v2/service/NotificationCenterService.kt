package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.GameSettingDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.NotificationDto
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.GameSettingRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.NotificationRepository
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.ZoneOffset
import java.util.UUID

@Service
class NotificationCenterService(
    private val notificationRepository: NotificationRepository,
    private val gameSettingRepository: GameSettingRepository,
    private val objectMapper: ObjectMapper
) {

    fun fetchNotifications(subjectKey: UUID, page: Int, size: Int): List<NotificationDto> {
        val pageable = PageRequest.of(page, size)
        return notificationRepository.findByRecipientKeyOrderByCreatedAtDesc(subjectKey, pageable)
            .map {
                NotificationDto(
                    id = it.id,
                    type = it.type,
                    title = it.title,
                    message = it.message,
                    link = it.link,
                    read = it.read,
                    createdAt = it.createdAt.atZone(ZoneOffset.UTC).toInstant()
                )
            }
    }

    @Transactional
    fun markAsRead(subjectKey: UUID, notificationId: UUID) {
        val notification = notificationRepository.findById(notificationId).orElseThrow()
        require(notification.recipientKey == subjectKey) { "Not authorized to update notification" }
        notification.read = true
        notificationRepository.save(notification)
    }

    fun getSettings(subjectKey: UUID): GameSettingDto? {
        val settings = gameSettingRepository.findById(subjectKey).orElse(null) ?: return null
        val map = objectMapper.readValue(settings.settings, Map::class.java) as Map<String, Any>
        return GameSettingDto(
            subjectKey = subjectKey,
            settings = map,
            updatedAt = settings.updatedAt
        )
    }

    @Transactional
    fun upsertSettings(subjectKey: UUID, settings: Map<String, Any>) {
        val payload = objectMapper.writeValueAsString(settings)
        val entity = gameSettingRepository.findById(subjectKey).orElse(null)
            ?.apply {
                this.settings = payload
                this.updatedAt = Instant.now()
            }
            ?: org.example.kotlin_liargame.domain.nemonemo.v2.model.GameSettingEntity(
                subjectKey = subjectKey,
                settings = payload
            )
        gameSettingRepository.save(entity)
    }
}
