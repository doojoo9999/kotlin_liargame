package org.example.kotlin_liargame.domain.question.controller

import org.example.kotlin_liargame.domain.question.dto.request.ApplyQuestionRequest
import org.example.kotlin_liargame.domain.question.dto.response.QuestionListResponse
import org.example.kotlin_liargame.domain.question.model.QuestionEntity
import org.example.kotlin_liargame.domain.question.service.QuestionService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/questions")
class QuestionController (
    private val questionService: QuestionService
){
    @PostMapping("/applyq")
    fun applyQuestion(
        @RequestBody req : ApplyQuestionRequest
    ) {
        questionService.applyQuestion(req)
    }

    @DeleteMapping("/delq/{id}")
    fun deleteQuestion(
        @RequestParam questionId: Long
    ) {
        questionService.removeQuestion(questionId)
    }

    @GetMapping("/qlist")
    fun findAllQuestions(): List<QuestionListResponse> {
        return questionService.findAll()
    }
}