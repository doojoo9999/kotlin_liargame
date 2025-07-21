package org.example.kotlin_liargame.domain.subject.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import org.example.kotlin_liargame.domain.question.model.QuestionEntity

@Entity
@Table(name = "subject")
class SubjectEntity (
    val content : String,
    @OneToMany(mappedBy = "subject", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    val question: List<QuestionEntity>
){
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}