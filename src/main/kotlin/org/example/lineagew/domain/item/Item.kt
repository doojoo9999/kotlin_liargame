package org.example.lineagew.domain.item

import jakarta.persistence.*
import org.example.lineagew.common.ItemGrade
import org.example.lineagew.common.ItemStatus
import org.example.lineagew.common.LineagewBaseEntity
import org.example.lineagew.domain.bosskill.BossKill
import java.time.LocalDate

@Entity
@Table(name = "linw_items")
class Item(
    @Column(nullable = false, length = 160)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var grade: ItemGrade = ItemGrade.COMMON,

    @Column(name = "acquired_at")
    var acquiredAt: LocalDate? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_boss_kill_id")
    var sourceBossKill: BossKill? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var status: ItemStatus = ItemStatus.IN_STOCK,

    @Column(columnDefinition = "text")
    var note: String? = null
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @OneToMany(mappedBy = "item", cascade = [CascadeType.ALL], orphanRemoval = true)
    val tags: MutableList<ItemTag> = mutableListOf()
}

@Entity
@Table(name = "linw_item_tags")
class ItemTag(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    var item: Item,

    @Column(nullable = false, length = 64)
    var tag: String
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
