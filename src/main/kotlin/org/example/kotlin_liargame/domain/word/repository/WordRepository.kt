package org.example.kotlin_liargame.domain.word.repository

import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.word.model.WordEntity
import org.springframework.data.jpa.repository.JpaRepository

interface WordRepository : JpaRepository<WordEntity, Long> {
    fun findBySubjectAndContent(subject: SubjectEntity, word: String) : WordEntity?
}
