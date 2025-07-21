package org.example.kotlin_liargame.domain.subject.repository

import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.springframework.data.jpa.repository.JpaRepository


interface SubjectRepository : JpaRepository<SubjectEntity, Long> {

    fun findByContent(content: String) : SubjectEntity?

}