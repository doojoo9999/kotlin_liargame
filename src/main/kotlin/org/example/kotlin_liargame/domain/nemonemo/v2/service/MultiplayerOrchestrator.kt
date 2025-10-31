package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.MultiplayerJoinResponse
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.MultiplayerParticipantDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.MultiplayerSessionCreateRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.MultiplayerSessionDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.SessionPrivacy
import org.example.kotlin_liargame.domain.nemonemo.v2.model.MultiplayerParticipantEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.MultiplayerParticipantId
import org.example.kotlin_liargame.domain.nemonemo.v2.model.MultiplayerSessionEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.MultiplayerStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.MultiplayerParticipantRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.MultiplayerSessionRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.Base64
import java.util.UUID

@Service
class MultiplayerOrchestrator(
    private val multiplayerSessionRepository: MultiplayerSessionRepository,
    private val multiplayerParticipantRepository: MultiplayerParticipantRepository,
    private val puzzleRepository: PuzzleRepository,
    private val objectMapper: ObjectMapper
) {

    @Transactional
    fun createSession(hostKey: UUID, request: MultiplayerSessionCreateRequest): MultiplayerSessionDto {
        val puzzle = puzzleRepository.findById(request.puzzleId).orElseThrow()
        val session = MultiplayerSessionEntity(
            mode = request.mode,
            puzzle = puzzle,
            hostKey = hostKey,
            participantsSnapshot = "[]"
        )
        val saved = multiplayerSessionRepository.save(session)
        addParticipant(saved.id, hostKey, ready = false)
        return toDto(saved, SessionPrivacy.PUBLIC)
    }

    @Transactional
    fun joinSession(sessionId: UUID, subjectKey: UUID): MultiplayerJoinResponse {
        val session = multiplayerSessionRepository.findById(sessionId).orElseThrow()
        addParticipant(session.id, subjectKey, ready = false)
        val token = generateSessionToken(session.id, subjectKey)
        return MultiplayerJoinResponse(
            session = toDto(session, SessionPrivacy.PUBLIC),
            token = token
        )
    }

    @Transactional
    fun updateReadyState(sessionId: UUID, subjectKey: UUID, ready: Boolean): MultiplayerSessionDto {
        val participantId = MultiplayerParticipantId(sessionId, subjectKey)
        val participant = multiplayerParticipantRepository.findById(participantId).orElseThrow()
        participant.ready = ready
        multiplayerParticipantRepository.save(participant)
        val session = multiplayerSessionRepository.findById(sessionId).orElseThrow()
        val allReady = multiplayerParticipantRepository.findAllByIdSessionId(sessionId).all { it.ready }
        if (allReady && session.status == MultiplayerStatus.WAITING) {
            session.status = MultiplayerStatus.IN_PROGRESS
            session.startedAt = Instant.now()
            multiplayerSessionRepository.save(session)
        }
        return toDto(session, SessionPrivacy.PUBLIC)
    }

    private fun addParticipant(sessionId: UUID, subjectKey: UUID, ready: Boolean) {
        val participant = MultiplayerParticipantEntity(
            id = MultiplayerParticipantId(sessionId, subjectKey),
            ready = ready
        )
        multiplayerParticipantRepository.save(participant)
    }

    private fun toDto(
        session: MultiplayerSessionEntity,
        privacy: SessionPrivacy
    ): MultiplayerSessionDto {
        val participants = multiplayerParticipantRepository.findAllByIdSessionId(session.id)
            .map(::toParticipantDto)
        return MultiplayerSessionDto(
            sessionId = session.id,
            mode = session.mode,
            status = session.status,
            hostKey = session.hostKey,
            puzzleId = session.puzzle.id,
            participants = participants,
            websocketEndpoint = "/ws/multiplayer/${session.id}",
            createdAt = session.createdAt,
            startedAt = session.startedAt,
            finishedAt = session.finishedAt
        )
    }

    private fun toParticipantDto(entity: MultiplayerParticipantEntity): MultiplayerParticipantDto =
        MultiplayerParticipantDto(
            subjectKey = entity.id.subjectKey,
            nickname = null,
            ready = entity.ready,
            score = entity.score,
            finishTimeMs = entity.finishTimeMs,
            disconnected = entity.disconnected
        )

    private fun generateSessionToken(sessionId: UUID, subjectKey: UUID): String {
        val payload = mapOf(
            "sessionId" to sessionId.toString(),
            "subjectKey" to subjectKey.toString(),
            "issuedAt" to Instant.now().toEpochMilli()
        )
        return Base64.getUrlEncoder().encodeToString(objectMapper.writeValueAsBytes(payload))
    }
}
