package org.example.kotlin_liargame.domain.nemonemo.v2.dto

import java.time.Instant
import java.util.UUID

data class NotificationDto(
    val id: UUID,
    val type: String,
    val title: String,
    val message: String,
    val link: String?,
    val read: Boolean,
    val createdAt: Instant
)

data class GameSettingDto(
    val subjectKey: UUID,
    val settings: Map<String, Any>,
    val updatedAt: Instant
)

data class FollowDto(
    val followerKey: UUID,
    val followeeKey: UUID,
    val followedAt: Instant
)
