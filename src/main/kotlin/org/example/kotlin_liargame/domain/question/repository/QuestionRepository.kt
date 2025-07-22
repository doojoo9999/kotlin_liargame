package org.example.kotlin_liargame.domain.question.repository

import org.aspectj.weaver.patterns.TypePatternQuestions
import org.example.kotlin_liargame.domain.question.model.QuestionEntity
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.springframework.data.jpa.repository.JpaRepository

interface QuestionRepository : JpaRepository<QuestionEntity, Long> {
    fun findBySubjectAndContent(subject: SubjectEntity, question: String) : QuestionEntity?
}