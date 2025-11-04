package org.example.kotlin_liargame.domain.nemonemo.v2.model

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.io.Serializable
import java.time.Instant
import java.util.UUID
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes

@Entity
@Table(name = "multiplayer_sessions")
class MultiplayerSessionEntity(
    @jakarta.persistence.Id
    @Column(columnDefinition = "uuid")
    val id: UUID = UUID.randomUUID(),

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    val mode: MultiplayerMode,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "puzzle_id", nullable = false)
    val puzzle: PuzzleEntity,

    @Column(name = "host_key", nullable = false, columnDefinition = "uuid")
    val hostKey: UUID,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var status: MultiplayerStatus = MultiplayerStatus.WAITING,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "participants", columnDefinition = "jsonb", nullable = false)
    var participantsSnapshot: String,

    @Column(name = "started_at")
    var startedAt: Instant? = null,

    @Column(name = "finished_at")
    var finishedAt: Instant? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result", columnDefinition = "jsonb")
    var result: String? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)

@Embeddable
data class MultiplayerParticipantId(
    @Column(name = "session_id", columnDefinition = "uuid")
    val sessionId: UUID,

    @Column(name = "subject_key", columnDefinition = "uuid")
    val subjectKey: UUID
) : Serializable

@Entity
@Table(name = "multiplayer_participants")
class MultiplayerParticipantEntity(
    @EmbeddedId
    val id: MultiplayerParticipantId,

    @Column(name = "joined_at", nullable = false)
    val joinedAt: Instant = Instant.now(),

    @Column(nullable = false)
    var ready: Boolean = false,

    @Column
    var score: Int? = null,

    @Column(name = "finish_time_ms")
    var finishTimeMs: Long? = null,

    @Column(nullable = false)
    var disconnected: Boolean = false
)
