package org.example.kotlin_liargame.domain.profanity.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.profanity.dto.request.SuggestProfanityRequest
import org.example.kotlin_liargame.domain.profanity.dto.response.ProfanityRequestResponse
import org.example.kotlin_liargame.domain.profanity.model.ProfanityEntity
import org.example.kotlin_liargame.domain.profanity.model.ProfanityRequestEntity
import org.example.kotlin_liargame.domain.profanity.model.ProfanityRequestStatus
import org.example.kotlin_liargame.domain.profanity.repository.ProfanityRepository
import org.example.kotlin_liargame.domain.profanity.repository.ProfanityRequestRepository
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.global.exception.NotFoundException
import org.example.kotlin_liargame.global.exception.UserNotFoundException
import org.example.kotlin_liargame.global.util.SessionUtil
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ProfanityService(
    private val profanityRequestRepository: ProfanityRequestRepository,
    private val profanityRepository: ProfanityRepository,
    private val userRepository: UserRepository,
    private val sessionUtil: SessionUtil
) {

    @Transactional
    fun suggestWord(request: SuggestProfanityRequest, session: HttpSession) {
        val userId = sessionUtil.requireUserId(session)
        val user = userRepository.findById(userId).orElseThrow { UserNotFoundException("User not found with id: $userId") }

        val profanityRequest = ProfanityRequestEntity(
            word = request.word.lowercase(),
            suggester = user
        )
        profanityRequestRepository.save(profanityRequest)
    }

    @Transactional(readOnly = true)
    fun getPendingRequests(): List<ProfanityRequestResponse> {
        return profanityRequestRepository.findByStatus(ProfanityRequestStatus.PENDING)
            .map { ProfanityRequestResponse(it) }
    }

    @Transactional
    @CacheEvict(value = ["approvedProfanities"], allEntries = true)
    fun approveRequest(requestId: Long) {
        val request = profanityRequestRepository.findById(requestId)
            .orElseThrow { NotFoundException("Profanity request not found with id: $requestId") }

        if (request.status != ProfanityRequestStatus.PENDING) {
            throw IllegalStateException("Request is not in PENDING state")
        }

        request.status = ProfanityRequestStatus.APPROVED

        if (!profanityRepository.existsByWord(request.word)) {
            val profanity = ProfanityEntity(word = request.word)
            profanityRepository.save(profanity)
        }
    }

    @Transactional
    fun rejectRequest(requestId: Long) {
        val request = profanityRequestRepository.findById(requestId)
            .orElseThrow { NotFoundException("Profanity request not found with id: $requestId") }

        if (request.status != ProfanityRequestStatus.PENDING) {
            throw IllegalStateException("Request is not in PENDING state")
        }

        request.status = ProfanityRequestStatus.REJECTED
    }

    @Cacheable("approvedProfanities")
    fun getApprovedWords(): Set<String> {
        return profanityRepository.findAll().map { it.word }.toSet()
    }
}
