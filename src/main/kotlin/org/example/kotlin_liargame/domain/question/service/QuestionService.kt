package org.example.kotlin_liargame.domain.question.service

import jakarta.transaction.Transactional
import org.example.kotlin_liargame.domain.question.dto.request.ApplyQuestionRequest
import org.example.kotlin_liargame.domain.question.dto.response.QuestionListResponse
import org.example.kotlin_liargame.domain.question.model.QuestionEntity
import org.example.kotlin_liargame.domain.question.repository.QuestionRepository
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.springframework.stereotype.Service

@Service
class QuestionService (
    private val questionRepository: QuestionRepository,
    private val subjectRepository: SubjectRepository
){

    @Transactional
    fun applyQuestion(req: ApplyQuestionRequest) {
        val subject = subjectRepository.findByContent(req.subject)
            ?: throw IllegalArgumentException("Subject '${req.subject}' not found.") // 예외 처리 예시
        val question = req.to(subject)
        questionRepository.save(question)
    }

    @Transactional
    fun removeQuestion(questionId: Long) {
        val question = questionRepository.findById(questionId)
            .orElseThrow {
                RuntimeException("Question not found")
            }
        questionRepository.delete(question)
    }

    fun findAll(): List<QuestionListResponse> {

        return questionRepository.findAll().map { questionEntity ->
            QuestionListResponse.from(questionEntity)
        }
    }

}