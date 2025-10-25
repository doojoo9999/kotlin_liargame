package org.example.lineagew.domain.member

import jakarta.persistence.*
import org.example.lineagew.common.LineagewBaseEntity
import org.example.lineagew.common.MemberRole
import org.example.lineagew.common.MemberStatus
import java.time.LocalDate

@Entity
@Table(name = "linw_members")
class Member(
    @Column(nullable = false, unique = true, length = 80)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var status: MemberStatus = MemberStatus.ACTIVE,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var role: MemberRole = MemberRole.USER,

    @Column(name = "joined_at")
    var joinedAt: LocalDate? = null,

    @Column(columnDefinition = "text")
    var memo: String? = null
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @Column(name = "last_active_at")
    var lastActiveAt: LocalDate? = null

    fun markActive(on: LocalDate) {
        lastActiveAt = on
        if (status == MemberStatus.INACTIVE) {
            status = MemberStatus.ACTIVE
        }
    }
}
