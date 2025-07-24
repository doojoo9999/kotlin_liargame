package org.example.kotlin_liargame.domain.subject.service

import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.dto.response.SubjectResponse
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.springframework.stereotype.Service

@Service
class SubjectService (
    val subjectRepository: SubjectRepository
){

    fun applySubject(subjectRequest: SubjectRequest) {
        val subject = subjectRepository.findByContent(subjectRequest.content)

        if (subject == null) {
            subjectRepository.save(subjectRequest.to())
        } else {
            throw RuntimeException("Subject already exists")
        }

    }

    fun deleteSubject(subjectRequest: SubjectRequest) {
        val subject = subjectRepository.findByContent(subjectRequest.content)
            ?: throw RuntimeException("Subject not found")
        subjectRepository.delete(subject)
    }

    fun findAll() : List<SubjectResponse>{
        return subjectRepository.findAll().map { subjectEntity ->
            SubjectResponse.from(subjectEntity)
        }
    }


}