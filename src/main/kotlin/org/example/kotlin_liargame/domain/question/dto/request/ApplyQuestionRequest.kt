package org.example.kotlin_liargame.domain.question.dto.request

import org.example.kotlin_liargame.domain.question.model.QuestionEntity
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity

data class ApplyQuestionRequest(
    val subject: String,
    val question: String
) {
    fun to(subjectEntity: SubjectEntity) = QuestionEntity(
        content = this.question,
        subject = subjectEntity
    )
}