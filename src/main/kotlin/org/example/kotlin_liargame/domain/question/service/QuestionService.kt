package org.example.kotlin_liargame.domain.question.service

import org.example.kotlin_liargame.domain.question.dto.ApplyQuestionRequest
import org.example.kotlin_liargame.domain.question.model.QuestionEntity
import org.example.kotlin_liargame.domain.question.repository.QuestionRepository
import org.springframework.stereotype.Service

@Service
class QuestionService (
    private val questionRepository: QuestionRepository
){

    fun applyQuestion(req: ApplyQuestionRequest) {
        val question = req.to()
        questionRepository.save(question)
    }

    fun removeQuestion(questionId: Long) {
        val question = questionRepository.findById(questionId)
            .orElseThrow {
                RuntimeException("Question not found")
            }
        questionRepository.delete(question)
    }

    fun findAll(): List<QuestionEntity> {
        return questionRepository.findAll()
    }

}