package org.example.lineagew.application.service

import org.example.lineagew.application.dto.MemberCreateRequest
import org.example.lineagew.application.dto.MemberResponse
import org.example.lineagew.application.dto.MemberUpdateRequest
import org.example.lineagew.application.dto.toResponse
import org.example.lineagew.common.MemberStatus
import org.example.lineagew.domain.member.Member
import org.example.lineagew.domain.member.MemberRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberService(
    private val memberRepository: MemberRepository
) {

    @Transactional(readOnly = true)
    fun getMembers(): List<MemberResponse> = memberRepository.findAll()
        .sortedBy { it.name.lowercase() }
        .map { it.toResponse() }

    @Transactional
    fun createMember(request: MemberCreateRequest): MemberResponse {
        memberRepository.findByNameIgnoreCase(request.name).ifPresent {
            error("Member with name ${request.name} already exists")
        }
        val member = Member(
            name = request.name.trim(),
            joinedAt = request.joinedAt,
            role = request.role,
            memo = request.memo,
            status = MemberStatus.ACTIVE
        )
        val saved = memberRepository.save(member)
        return saved.toResponse()
    }

    @Transactional
    fun updateMember(id: Long, request: MemberUpdateRequest): MemberResponse {
        val member = memberRepository.findById(id).orElseThrow { IllegalArgumentException("Member not found: $id") }
        request.status?.let { member.status = it }
        request.role?.let { member.role = it }
        request.joinedAt?.let { member.joinedAt = it }
        member.memo = request.memo ?: member.memo
        return member.toResponse()
    }

    @Transactional
    fun deactivateMember(id: Long): MemberResponse {
        val member = memberRepository.findById(id).orElseThrow { IllegalArgumentException("Member not found: $id") }
        member.status = MemberStatus.INACTIVE
        return member.toResponse()
    }
}
