package org.example.kotlin_liargame.domain.subject.service

import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.springframework.stereotype.Service
import javax.security.auth.Subject

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

}