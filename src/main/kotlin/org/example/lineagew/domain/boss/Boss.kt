package org.example.lineagew.domain.boss

import jakarta.persistence.*
import org.example.lineagew.common.LineagewBaseEntity

@Entity
@Table(name = "linw_bosses")
class Boss(
    @Column(nullable = false, unique = true, length = 120)
    var name: String,

    @Column(length = 32)
    var tier: String? = null,

    @Column(columnDefinition = "text")
    var memo: String? = null
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
