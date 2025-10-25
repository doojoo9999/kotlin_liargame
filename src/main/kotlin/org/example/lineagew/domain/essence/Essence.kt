package org.example.lineagew.domain.essence

import jakarta.persistence.*
import org.example.lineagew.common.LineagewBaseEntity
import java.time.LocalDate

@Entity
@Table(name = "linw_essences")
class Essence(
    @Column(nullable = false, unique = true, length = 80)
    var name: String,

    @Column(nullable = false)
    var quantity: Long = 0,

    @Column(columnDefinition = "text")
    var memo: String? = null
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    fun apply(delta: Long) {
        quantity += delta
        require(quantity >= 0) { "Essence quantity cannot be negative" }
    }
}

@Entity
@Table(name = "linw_essence_txns")
class EssenceTxn(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "essence_id", nullable = false)
    var essence: Essence,

    @Column(name = "occurred_at", nullable = false)
    var occurredAt: LocalDate,

    @Column(name = "delta_qty", nullable = false)
    var deltaQty: Long,

    @Column(nullable = false, length = 160)
    var reason: String,

    @Column(columnDefinition = "text")
    var memo: String? = null
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
