package org.example.kotlin_liargame.domain.subject.service

import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.dto.response.SubjectResponse
import org.example.kotlin_liargame.domain.subject.exception.SubjectAlreadyExistsException
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.domain.word.repository.WordRepository
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SubjectService (
    val subjectRepository: SubjectRepository,
    val wordRepository: WordRepository,
    private val messagingTemplate: SimpMessagingTemplate
){

    @Transactional
    fun applySubject(subjectRequest: SubjectRequest): SubjectEntity {
        val existingSubject = subjectRepository.findByContent(subjectRequest.name)
        if (existingSubject == null) {
            val savedSubject = subjectRepository.save(subjectRequest.to())  // ✅ 저장된 엔티티 반환
            
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
    fun deleteSubject(subjectRequest: SubjectRequest) {
        val subject = subjectRepository.findByContent(subjectRequest.name)
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
            "subjectId" to subjectRequest.name
        ))
    }

    @Transactional(readOnly = true)
    fun findAll() : List<SubjectResponse>{
        return subjectRepository.findAll().map { subjectEntity ->
            SubjectResponse.from(subjectEntity)
        }
    }
}
