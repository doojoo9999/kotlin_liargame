package org.example.kotlin_liargame.domain.word.service

import jakarta.transaction.Transactional
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.domain.word.dto.request.ApplyWordRequest
import org.example.kotlin_liargame.domain.word.dto.response.WordListResponse
import org.example.kotlin_liargame.domain.word.repository.WordRepository
import org.slf4j.LoggerFactory
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service

@Service
class WordService (
    private val wordRepository: WordRepository,
    private val subjectRepository: SubjectRepository,
    private val messagingTemplate: SimpMessagingTemplate
){
    private val logger = LoggerFactory.getLogger(this::class.java)


    @Transactional
    fun applyWord(req: ApplyWordRequest) {

        val subject = subjectRepository.findByContent(req.subject)
            ?: throw IllegalArgumentException("주제 '${req.subject}'�?찾을 ???�습?�다.")

        val existingWord = wordRepository.findBySubjectAndContent(subject, req.word)

        if (existingWord != null) {
            throw RuntimeException("?�어 '${req.word}'???��? 주제 '${req.subject}'??존재?�니??")
        }
        val newWordEntity = req.to(subject)
        wordRepository.save(newWordEntity)
        
        // Send WebSocket notification for word addition
        messagingTemplate.convertAndSend("/topic/subjects", mapOf(
            "type" to "WORD_ADDED",
            "subject" to req.subject,
            "word" to req.word
        ))
    }

    @Transactional
    fun removeWord(wordId: Long) {
        val word = wordRepository.findById(wordId)
            .orElseThrow {
                RuntimeException("?�어�?찾을 ???�습?�다")
            }
        wordRepository.delete(word)
        
        // Send WebSocket notification for word deletion
        messagingTemplate.convertAndSend("/topic/subjects", mapOf(
            "type" to "WORD_DELETED",
            "wordId" to wordId
        ))
    }

    fun findAll(): List<WordListResponse> {

        return wordRepository.findAll().map { wordEntity ->
            WordListResponse.from(wordEntity)
        }
    }

}
