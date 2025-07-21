package org.example.kotlin_liargame.domain.question.dto

import org.example.kotlin_liargame.domain.question.model.QuestionEntity

data class ApplyQuestionRequest(
    val subject: String,
    val question: String
) {
    fun to() = QuestionEntity(
        subject = this.subject,
        question = this.question
    )
}
