package org.example.kotlin_liargame.domain.subject.model

import com.fasterxml.jackson.annotation.JsonManagedReference
import jakarta.persistence.*
import org.example.kotlin_liargame.domain.question.model.QuestionEntity

@Entity
@Table(name = "subject")
class SubjectEntity (
    val content : String,

    @JsonManagedReference
    @OneToMany(mappedBy = "subject", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    val question: List<QuestionEntity>
){
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}