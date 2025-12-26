package org.example.kotlin_liargame.domain.invest.model.enum

import com.fasterxml.jackson.annotation.JsonCreator

enum class InvestmentAction {
    BUY,
    SELL,
    HOLD;

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): InvestmentAction {
            return entries.firstOrNull { it.name.equals(value.trim(), ignoreCase = true) }
                ?: throw IllegalArgumentException("Unknown investment action: $value")
        }
    }
}
