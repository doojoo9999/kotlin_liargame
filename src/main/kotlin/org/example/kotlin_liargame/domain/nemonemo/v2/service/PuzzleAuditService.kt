package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleAuditLogDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleAuditLogPageDto
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleAuditAction
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleAuditLogEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleAuditLogRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID

@Service
class PuzzleAuditService(
    private val puzzleAuditLogRepository: PuzzleAuditLogRepository,
    private val objectMapper: ObjectMapper
) {

    private val logger = LoggerFactory.getLogger(javaClass)

    fun record(
        puzzleId: UUID,
        actorKey: UUID,
        action: PuzzleAuditAction,
        payload: Map<String, Any?> = emptyMap()
    ) {
        val sanitizedPayload = payload.filterValues { it != null }
        val serialized = runCatching {
            if (sanitizedPayload.isEmpty()) {
                null
            } else {
                objectMapper.writeValueAsString(sanitizedPayload)
            }
        }.onFailure {
            logger.warn("Failed to serialize puzzle audit payload for {} action {}", puzzleId, action, it)
        }.getOrNull()

        puzzleAuditLogRepository.save(
            PuzzleAuditLogEntity(
                puzzleId = puzzleId,
                action = action,
                actorKey = actorKey,
                payload = serialized
            )
        )
    }

    fun fetchPage(
        puzzleId: UUID,
        cursor: String?,
        limit: Int
    ): PuzzleAuditLogPageDto {
        val sanitizedLimit = limit.coerceIn(1, 100)
        val logs = puzzleAuditLogRepository.findByPuzzleIdOrderByCreatedAtAsc(puzzleId)
        val filtered = applyCursor(logs, cursor)
        val pageItems = filtered.take(sanitizedLimit)
        val nextCursor = if (filtered.size > sanitizedLimit) {
            encodeCursor(pageItems.last())
        } else {
            null
        }
        return PuzzleAuditLogPageDto(
            items = pageItems.map(::toDto),
            nextCursor = nextCursor
        )
    }

    private fun toDto(entity: PuzzleAuditLogEntity): PuzzleAuditLogDto = PuzzleAuditLogDto(
        id = entity.id,
        action = entity.action.name,
        actorKey = entity.actorKey,
        payload = deserializePayload(entity.payload),
        createdAt = entity.createdAt
    )

    private fun applyCursor(
        logs: List<PuzzleAuditLogEntity>,
        cursor: String?
    ): List<PuzzleAuditLogEntity> {
        if (cursor.isNullOrBlank()) {
            return logs
        }
        val parsed = parseCursor(cursor) ?: return logs
        return logs.dropWhile { entity ->
            entity.createdAt.isBefore(parsed.first) ||
                (entity.createdAt.isEqual(parsed.first) && entity.id != parsed.second)
        }.dropWhile { entity ->
            entity.createdAt.isEqual(parsed.first) && entity.id == parsed.second
        }
    }

    private fun parseCursor(raw: String): Pair<LocalDateTime, UUID>? {
        val parts = raw.split("|")
        if (parts.size != 2) return null
        return runCatching {
            val timestamp = LocalDateTime.parse(parts[0], CURSOR_FORMATTER)
            val id = UUID.fromString(parts[1])
            timestamp to id
        }.getOrNull()
    }

    private fun encodeCursor(entity: PuzzleAuditLogEntity): String =
        CURSOR_FORMATTER.format(entity.createdAt) + "|" + entity.id

    private fun deserializePayload(raw: String?): JsonNode? {
        if (raw.isNullOrBlank()) {
            return null
        }
        return runCatching {
            objectMapper.readTree(raw)
        }.onFailure {
            logger.warn("Failed to deserialize puzzle audit payload: {}", raw, it)
        }.getOrNull()
    }
}

private val CURSOR_FORMATTER: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME
