package org.example.kotlin_liargame.domain.question.service

import jakarta.transaction.Transactional
import org.example.kotlin_liargame.domain.question.dto.request.ApplyQuestionRequest
import org.example.kotlin_liargame.domain.question.dto.response.QuestionListResponse
import org.example.kotlin_liargame.domain.question.repository.QuestionRepository
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class QuestionService (
    private val questionRepository: QuestionRepository,
    private val subjectRepository: SubjectRepository
){
    private val logger = LoggerFactory.getLogger(this::class.java)


    @Transactional
    fun applyQuestion(req: ApplyQuestionRequest) {

        val subject = subjectRepository.findByContent(req.subject)
            ?: throw IllegalArgumentException("Subject '${req.subject}' not found.")

        val existingQuestion = questionRepository.findBySubjectAndContent(subject, req.question)

        if (existingQuestion != null) {
            throw RuntimeException("Question '${req.question}' already exists for Subject '${req.subject}'.")
        }
        val newQuestionEntity = req.to(subject)
        questionRepository.save(newQuestionEntity)
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