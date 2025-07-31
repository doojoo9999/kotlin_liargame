package org.example.kotlin_liargame.domain.word.service

import jakarta.transaction.Transactional
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.domain.word.dto.request.ApplyWordRequest
import org.example.kotlin_liargame.domain.word.dto.response.WordListResponse
import org.example.kotlin_liargame.domain.word.repository.WordRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class WordService (
    private val wordRepository: WordRepository,
    private val subjectRepository: SubjectRepository
){
    private val logger = LoggerFactory.getLogger(this::class.java)


    @Transactional
    fun applyWord(req: ApplyWordRequest) {

        val subject = subjectRepository.findByContent(req.subject)
            ?: throw IllegalArgumentException("Ï£ºÏ†ú '${req.subject}'Î•?Ï∞æÏùÑ ???ÜÏäµ?àÎã§.")

        val existingWord = wordRepository.findBySubjectAndContent(subject, req.word)

        if (existingWord != null) {
            throw RuntimeException("?®Ïñ¥ '${req.word}'???¥Î? Ï£ºÏ†ú '${req.subject}'??Ï°¥Ïû¨?©Îãà??")
        }
        val newWordEntity = req.to(subject)
        wordRepository.save(newWordEntity)
    }

    @Transactional
    fun removeWord(wordId: Long) {
        val word = wordRepository.findById(wordId)
            .orElseThrow {
                RuntimeException("?®Ïñ¥Î•?Ï∞æÏùÑ ???ÜÏäµ?àÎã§")
            }
        wordRepository.delete(word)
    }

    fun findAll(): List<WordListResponse> {

        return wordRepository.findAll().map { wordEntity ->
            WordListResponse.from(wordEntity)
        }
    }

}
