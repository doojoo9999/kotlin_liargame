package org.example.kotlin_liargame.domain.subject.service

import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.springframework.stereotype.Service

@Service
class SubjectService (
    val subjectRepository: SubjectRepository
){

    fun applySubject(subjectRequest: SubjectRequest) {
        val subject = subjectRepository.findByContentOrNull(subjectRequest.content)

        if (subject == null) {
            subjectRepository.save(subject)
        }

        throw RuntimeException("Subject already exists")

    }

    fun deleteSubject(subjectRequest: SubjectRequest) {
        val subject = subjectRepository.findByContentOrNull(subjectRequest.content)
        subjectRepository.delete(subject)
    }

    fun findAll() : List<SubjectEntity>{
        return subjectRepository.findAll()
    }

}