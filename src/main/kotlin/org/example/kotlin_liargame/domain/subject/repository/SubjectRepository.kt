package org.example.kotlin_liargame.domain.subject.repository

import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.springframework.data.jpa.repository.JpaRepository
import javax.security.auth.Subject

interface SubjectRepository : JpaRepository<Subject, Long> {

    fun findByContentOrNull(content: String) : SubjectEntity

}