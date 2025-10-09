package org.example.kotlin_liargame.domain.word.service

import jakarta.transaction.Transactional
import org.example.kotlin_liargame.domain.config.ContentProperties
import org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.domain.word.dto.request.ApplyWordRequest
import org.example.kotlin_liargame.domain.word.dto.response.WordListResponse
import org.example.kotlin_liargame.domain.word.exception.SubjectNotFoundException
import org.example.kotlin_liargame.domain.word.exception.WordAlreadyExistsException
import org.example.kotlin_liargame.domain.word.repository.WordRepository
import org.slf4j.LoggerFactory
import org.springframework.data.repository.findByIdOrNull
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service

@Service
class WordService (
    private val wordRepository: WordRepository,
    private val subjectRepository: SubjectRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val contentProperties: ContentProperties,
    private val forbiddenWordService: ForbiddenWordService
){
    private val logger = LoggerFactory.getLogger(this::class.java)


    @Transactional
    fun applyWord(req: ApplyWordRequest): WordListResponse {
        // 금지된 단어 검증
        forbiddenWordService.validateWord(req.word)

        val subject = subjectRepository.findByIdOrNull(req.subjectId)
            ?: throw SubjectNotFoundException("주제 '${req.subjectId}'를 찾을 수 없습니다.")

        val existingWord = wordRepository.findBySubjectAndContent(subject, req.word)

        if (existingWord != null) {
            throw WordAlreadyExistsException("단어 '${req.word}'는 이미 주제 '${req.subjectId}'에 존재합니다.")
        }
        val newWordEntity = req.to(subject)
        if (!contentProperties.manualApprovalRequired) {
            newWordEntity.status = ContentStatus.APPROVED
        }
        val savedWord = wordRepository.save(newWordEntity)
        
        messagingTemplate.convertAndSend("/topic/subjects", mapOf(
            "type" to "WORD_ADDED",
            "subject" to req.subjectId,
            "word" to req.word
        ))

        return WordListResponse.from(savedWord)
    }

    @Transactional
    fun removeWord(wordId: Long) {
        val word = wordRepository.findById(wordId)
            .orElseThrow {
                RuntimeException("단어를 찾을 수 없습니다")
            }
        wordRepository.delete(word)
        
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

    @Transactional
    fun approveAllPendingWords(): List<WordListResponse> {
        val pendingWords = wordRepository.findByStatus(ContentStatus.PENDING)

        val approvedWords = pendingWords.map { word ->
            word.status = ContentStatus.APPROVED
            wordRepository.save(word)
            word
        }

        // WebSocket으로 승인된 단어들에 대한 알림 전송
        approvedWords.forEach { word ->
            messagingTemplate.convertAndSend("/topic/subjects", mapOf(
                "type" to "WORD_APPROVED",
                "wordId" to word.id,
                "subject" to word.subject?.content,
                "word" to word.content
            ))
        }

        logger.info("일괄 승인된 단어 수: ${approvedWords.size}")

        return approvedWords.map { WordListResponse.from(it) }
    }

}