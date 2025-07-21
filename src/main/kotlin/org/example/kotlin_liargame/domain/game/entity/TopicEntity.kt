//package org.example.kotlin_liargame.domain.entity
//
//import jakarta.persistence.*
//
//@Entity
//@Table(name = "topic")
//class TopicEntity (
//    val name : String,
//    @OneToMany(mappedBy = "topic", cascade = [CascadeType.ALL])
//    val answer : MutableList<AnswerEntity> = mutableListOf(),
//){
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    val id : Long = 0
//}