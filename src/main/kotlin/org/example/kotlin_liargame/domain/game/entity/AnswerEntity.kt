//package org.example.kotlin_liargame.domain.entity
//
//import jakarta.persistence.*
//
//@Entity
//@Table(name = "answer")
//class AnswerEntity (
//    val value : String,
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn( name = "topic_id")
//    val topic : TopicEntity
//){
//    @Id
//    @GeneratedValue (strategy = GenerationType.IDENTITY)
//    val id : Long = 0
//}