package org.example.lineagew.presentation

import jakarta.validation.Valid
import org.example.lineagew.application.dto.GlobalPolicyRequest
import org.example.lineagew.application.dto.GlobalPolicyResponse
import org.example.lineagew.application.service.PolicyService
import org.example.lineagew.common.security.LineagewAdminOnly
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/lineage/policy")
@Validated
class PolicyController(
    private val policyService: PolicyService
) {

    @GetMapping
    fun getPolicy(): GlobalPolicyResponse = policyService.getPolicy()

    @LineagewAdminOnly
    @PutMapping
    fun updatePolicy(@Valid @RequestBody request: GlobalPolicyRequest): GlobalPolicyResponse =
        policyService.updatePolicy(request)
}
