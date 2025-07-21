package org.example.kotlin_liargame.domain.question.dto

import org.example.kotlin_liargame.domain.question.model.QuestionEntity
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity

data class ApplyQuestionRequest(
    val subject: String,
    val question: String
) {
    fun to(subjectEntity: SubjectEntity) = QuestionEntity(
        question = this.question,
        subject = subjectEntity
    )
}
