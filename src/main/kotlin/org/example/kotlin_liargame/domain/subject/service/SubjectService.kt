package org.example.kotlin_liargame.domain.subject.service

import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.dto.response.SubjectResponse
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.domain.word.repository.WordRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SubjectService (
    val subjectRepository: SubjectRepository,
    val wordRepository: WordRepository
){

    @Transactional
    fun applySubject(subjectRequest: SubjectRequest) {
        val subject = subjectRepository.findByContent(subjectRequest.content)

        if (subject == null) {
            subjectRepository.save(subjectRequest.to())
        } else {
            throw RuntimeException("주제가 ?��? 존재?�니??)
        }
    }

    @Transactional
    fun deleteSubject(subjectRequest: SubjectRequest) {
        val subject = subjectRepository.findByContent(subjectRequest.content)
            ?: throw RuntimeException("주제�?찾을 ???�습?�다")

        val words = subject.word
        if (words.isNotEmpty()) {
            wordRepository.deleteAll(words)
            wordRepository.flush()
        }

        subjectRepository.delete(subject)
        subjectRepository.flush()
    }

    @Transactional(readOnly = true)
    fun findAll() : List<SubjectResponse>{
        return subjectRepository.findAll().map { subjectEntity ->
            SubjectResponse.from(subjectEntity)
        }
    }
}
