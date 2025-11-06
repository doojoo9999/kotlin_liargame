package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleAuditLogDto
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleAuditAction
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleAuditLogEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleAuditLogRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
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

    fun fetch(puzzleId: UUID): List<PuzzleAuditLogDto> {
        val logs = puzzleAuditLogRepository.findByPuzzleIdOrderByCreatedAtAsc(puzzleId)
        return logs.map { entity ->
            PuzzleAuditLogDto(
                id = entity.id,
                action = entity.action.name,
                actorKey = entity.actorKey,
                payload = deserializePayload(entity.payload),
                createdAt = entity.createdAt
            )
        }
    }

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
