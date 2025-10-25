package org.example.lineagew.application.service

import org.example.lineagew.application.dto.GlobalPolicyRequest
import org.example.lineagew.application.dto.GlobalPolicyResponse
import org.example.lineagew.application.dto.toResponse
import org.example.lineagew.domain.policy.GlobalPolicy
import org.example.lineagew.domain.policy.GlobalPolicyRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PolicyService(
    private val globalPolicyRepository: GlobalPolicyRepository
) {

    @Transactional(readOnly = true)
    fun getPolicy(): GlobalPolicyResponse {
        val policy = globalPolicyRepository.findAll().firstOrNull()
            ?: globalPolicyRepository.save(GlobalPolicy())
        return policy.toResponse()
    }

    @Transactional
    fun updatePolicy(request: GlobalPolicyRequest): GlobalPolicyResponse {
        val policy = globalPolicyRepository.findAll().firstOrNull() ?: GlobalPolicy()
        policy.defaultRounding = request.defaultRounding
        policy.defaultRemainder = request.defaultRemainder
        policy.defaultBonusWindow = request.defaultBonusWindow
        policy.defaultBonusCurve = request.defaultBonusCurve
        policy.bonusBaseMultiplier = request.bonusBaseMultiplier
        policy.bonusCapMultiplier = request.bonusCapMultiplier
        policy.penaltyFloorMultiplier = request.penaltyFloorMultiplier
        policy.decayPolicy = request.decayPolicy
        policy.decayHalfLifeDays = request.decayHalfLifeDays
        policy.bonusLinearSlope = request.bonusLinearSlope
        policy.bonusLinearIntercept = request.bonusLinearIntercept
        val saved = globalPolicyRepository.save(policy)
        return saved.toResponse()
    }
}
