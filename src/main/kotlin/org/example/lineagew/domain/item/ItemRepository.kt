package org.example.lineagew.domain.item

import org.example.lineagew.common.ItemStatus
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface ItemRepository : JpaRepository<Item, Long> {
    fun findAllByStatus(status: ItemStatus): List<Item>
    fun findAllByNameContainingIgnoreCase(keyword: String): List<Item>
    fun findAllByStatusAndNameContainingIgnoreCase(status: ItemStatus, keyword: String): List<Item>

    @EntityGraph(attributePaths = [
        "tags",
        "sourceBossKill",
        "sourceBossKill.boss",
        "sourceBossKill.participants",
        "sourceBossKill.participants.member"
    ])
    fun findDetailedById(id: Long): Optional<Item>
}
