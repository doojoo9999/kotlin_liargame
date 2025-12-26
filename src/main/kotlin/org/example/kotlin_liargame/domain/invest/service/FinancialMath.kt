package org.example.kotlin_liargame.domain.invest.service

import java.math.BigDecimal
import java.math.MathContext
import java.math.RoundingMode

object FinancialMath {
    const val PRICE_SCALE = 4
    const val QUANTITY_SCALE = 4
    const val RATE_SCALE = 6
    const val ROI_SCALE = 4

    val MATH_CONTEXT: MathContext = MathContext(34, RoundingMode.HALF_UP)

    fun scalePrice(value: BigDecimal): BigDecimal = value.setScale(PRICE_SCALE, RoundingMode.HALF_UP)

    fun scaleQuantity(value: BigDecimal): BigDecimal = value.setScale(QUANTITY_SCALE, RoundingMode.HALF_UP)

    fun scaleRate(value: BigDecimal): BigDecimal = value.setScale(RATE_SCALE, RoundingMode.HALF_UP)

    fun scaleRoi(value: BigDecimal): BigDecimal = value.setScale(ROI_SCALE, RoundingMode.HALF_UP)
}
