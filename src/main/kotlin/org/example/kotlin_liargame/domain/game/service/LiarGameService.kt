package org.example.kotlin_liargame.domain.service

import org.example.kotlin_liargame.domain.entity.GameEntity
import org.example.kotlin_liargame.domain.entity.MemberEntity
import org.example.kotlin_liargame.domain.repository.LiarGameRepository
import org.example.kotlin_liargame.domain.repository.TopicRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import kotlin.random.Random

@Service
class LiarGameService (
    private val liarGameRepository: LiarGameRepository,
    private val topicRepository: TopicRepository
){

    fun createGame(players : List<MemberEntity>, topicId:Long ) {
        val inGameLiar = players.random()
        val topic = topicRepository.findByIdOrNull(topicId) ?: throw IllegalStateException("Can not found topic")
        val answer = topic.answer
        val randomAnswer = answer[Random.nextInt(answer.size)].value

        val game = GameEntity(
            topic = topic.name,
            answer = randomAnswer,
            members = players.toMutableList(),
            liar = inGameLiar
        )
        liarGameRepository.save(game)
    }

    fun voteToKill(gameId: Long, playerId: Long){
        val game = liarGameRepository.findByIdOrNull(gameId) ?: throw IllegalStateException("Can not found game")
        val playerToKill = game.members.find { it.id == playerId }
        playerToKill?.isAlive = false

        liarGameRepository.save(game)

    }

    fun checkLiarGuess ( gameId : Long, guess: String) : Boolean {
        val game = liarGameRepository.findByIdOrNull(gameId) ?: throw IllegalStateException("Can not found game")
        return game.answer.equals(guess, ignoreCase = false)
    }

}