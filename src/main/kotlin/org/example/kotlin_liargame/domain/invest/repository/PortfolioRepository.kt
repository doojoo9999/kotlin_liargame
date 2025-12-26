package org.example.kotlin_liargame.domain.invest.repository

import org.example.kotlin_liargame.domain.invest.model.PortfolioEntity
import org.springframework.data.jpa.repository.JpaRepository

interface PortfolioRepository : JpaRepository<PortfolioEntity, Long>
