package org.example.kotlin_liargame.domain.subject.controller

import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.subject.service.SubjectService
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping
import javax.security.auth.Subject

@Controller
@RequestMapping("/subjects")
class SubjectController (
    val subjectService: SubjectService
) {

    fun applySubject(request: SubjectRequest) {
        subjectService.applySubject(request)
    }

    fun deleteSubject(request: SubjectRequest) {
        subjectService.deleteSubject(request)
    }

    fun subjectList(): List<SubjectEntity> {
        return subjectService.findAll()
    }

}