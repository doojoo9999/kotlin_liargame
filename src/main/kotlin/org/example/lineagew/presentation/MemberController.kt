package org.example.lineagew.presentation

import jakarta.validation.Valid
import org.example.lineagew.application.dto.MemberCreateRequest
import org.example.lineagew.application.dto.MemberResponse
import org.example.lineagew.application.dto.MemberUpdateRequest
import org.example.lineagew.application.service.MemberService
import org.example.lineagew.common.security.LineagewAdminOnly
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/lineage/members")
@Validated
class MemberController(
    private val memberService: MemberService
) {

    @GetMapping
    fun listMembers(): List<MemberResponse> = memberService.getMembers()

    @LineagewAdminOnly
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createMember(@Valid @RequestBody request: MemberCreateRequest): MemberResponse =
        memberService.createMember(request)

    @LineagewAdminOnly
    @PutMapping("/{id}")
    fun updateMember(
        @PathVariable id: Long,
        @Valid @RequestBody request: MemberUpdateRequest
    ): MemberResponse = memberService.updateMember(id, request)

    @LineagewAdminOnly
    @DeleteMapping("/{id}")
    fun deactivateMember(@PathVariable id: Long): MemberResponse = memberService.deactivateMember(id)
}
