//package org.example.kotlin_liargame.domain.entity
//
//import jakarta.persistence.*
//
//@Entity
//@Table(name = "game")
//class GameEntity (
//    val topic : String,
//    val answer: String,
//    val isGameActive : Boolean = true,
//
//    @OneToMany(mappedBy = "game", cascade = [CascadeType.ALL], fetch = FetchType.EAGER)
//    var members: MutableList<MemberEntity> = mutableListOf(),
//
//    @ManyToOne(fetch = FetchType.EAGER, cascade = [CascadeType.ALL])
//    @JoinColumn(name = "liar_id", nullable = false)
//    var liar: MemberEntity,
//
//){
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    val id : Long = 0
//}