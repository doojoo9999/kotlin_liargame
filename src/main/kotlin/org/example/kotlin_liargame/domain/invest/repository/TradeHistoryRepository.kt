package org.example.kotlin_liargame.domain.invest.repository

import org.example.kotlin_liargame.domain.invest.model.TradeHistoryEntity
import org.springframework.data.jpa.repository.JpaRepository

interface TradeHistoryRepository : JpaRepository<TradeHistoryEntity, Long>
