package org.example.kotlin_liargame.domain.subject.service

import org.example.kotlin_liargame.domain.config.ContentProperties
import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.dto.response.SubjectResponse
import org.example.kotlin_liargame.domain.subject.exception.SubjectAlreadyExistsException
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.domain.word.repository.WordRepository
import org.example.kotlin_liargame.domain.word.service.ForbiddenWordService
import org.springframework.data.repository.findByIdOrNull
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SubjectService (
    private val subjectRepository: SubjectRepository,
    private val wordRepository: WordRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val contentProperties: ContentProperties,
    private val forbiddenWordService: ForbiddenWordService
){

    @Transactional
    fun applySubject(subjectRequest: SubjectRequest): SubjectEntity {
        // 금지된 단어 검증
        forbiddenWordService.validateWord(subjectRequest.name)

        val existingSubject = subjectRepository.findByContent(subjectRequest.name)
        if (existingSubject == null) {
            val newSubject = subjectRequest.to()
            if (!contentProperties.manualApprovalRequired) {
                newSubject.status = ContentStatus.APPROVED
            }
            val savedSubject = subjectRepository.save(newSubject)  // ✅ 저장된 엔티티 반환
            
            messagingTemplate.convertAndSend("/topic/subjects", mapOf(
                "type" to "SUBJECT_ADDED",
                "subject" to mapOf(
                    "id" to savedSubject.id,
                    "name" to savedSubject.content
                )
            ))
            
            return savedSubject
        } else {
            throw SubjectAlreadyExistsException("주제가 이미 존재합니다")
        }
    }


    @Transactional
    fun deleteSubject(subjectId: Long) {
        val subject = subjectRepository.findByIdOrNull(subjectId)
            ?: throw RuntimeException("주제를 찾을 수 없습니다")

        val words = subject.word
        if (words.isNotEmpty()) {
            wordRepository.deleteAll(words)
            wordRepository.flush()
        }

        subjectRepository.delete(subject)
        subjectRepository.flush()

        messagingTemplate.convertAndSend("/topic/subjects", mapOf(
            "type" to "SUBJECT_DELETED",
            "subjectId" to subjectId
        ))
    }


    @Transactional(readOnly = true)
    fun findAll() : List<SubjectResponse>{
        return subjectRepository.findByStatus(ContentStatus.APPROVED).map { subjectEntity ->
            SubjectResponse.from(subjectEntity)
        }
    }

    @Transactional
    fun approveAllPendingSubjects(): List<SubjectResponse> {
        val pendingSubjects = subjectRepository.findByStatus(ContentStatus.PENDING)
        val approvedSubjects = mutableListOf<SubjectEntity>()

        pendingSubjects.forEach { subject ->
            subject.status = ContentStatus.APPROVED
            val savedSubject = subjectRepository.save(subject)
            approvedSubjects.add(savedSubject)

            // WebSocket으로 승인 알림 발송
            messagingTemplate.convertAndSend("/topic/subjects", mapOf(
                "type" to "SUBJECT_ADDED",
                "subject" to mapOf(
                    "id" to savedSubject.id,
                    "name" to savedSubject.content
                )
            ))
        }

        return approvedSubjects.map { SubjectResponse.from(it) }
    }
}
