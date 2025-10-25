package org.example.lineagew.domain.item

import org.example.lineagew.common.ItemStatus
import org.springframework.data.jpa.repository.JpaRepository

interface ItemRepository : JpaRepository<Item, Long> {
    fun findAllByStatus(status: ItemStatus): List<Item>
}
