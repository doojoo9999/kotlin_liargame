package org.example.lineagew.application.service

import io.mockk.every
import io.mockk.mockk
import org.example.lineagew.application.dto.MemberUpdateRequest
import org.example.lineagew.domain.member.Member
import org.example.lineagew.domain.member.MemberRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.util.Optional

class MemberServiceTest {

    private val memberRepository: MemberRepository = mockk()
    private val service = MemberService(memberRepository)

    @Test
    fun `updateMember renames when name is unique`() {
        val member = Member(name = "Old Name").apply { id = 1L }
        every { memberRepository.findById(1L) } returns Optional.of(member)
        every { memberRepository.findByNameIgnoreCase("New Name") } returns Optional.empty()

        val updated = service.updateMember(1L, MemberUpdateRequest(name = "New Name"))

        assertEquals("New Name", updated.name)
    }

    @Test
    fun `updateMember rejects duplicate name`() {
        val member = Member(name = "Old Name").apply { id = 1L }
        val other = Member(name = "New Name").apply { id = 2L }
        every { memberRepository.findById(1L) } returns Optional.of(member)
        every { memberRepository.findByNameIgnoreCase("New Name") } returns Optional.of(other)

        assertThrows<IllegalStateException> {
            service.updateMember(1L, MemberUpdateRequest(name = "New Name"))
        }
    }
}
