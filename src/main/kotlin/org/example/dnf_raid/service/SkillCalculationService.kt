package org.example.dnf_raid.service

import org.springframework.stereotype.Service

@Service
class SkillCalculationService {

    private val keywordTokens = listOf("공격력", "데미지", "피해", "attack", "damage")

    /**
     * Parses a skill description template with placeholders (e.g. "{value1}") and sums only the
     * lines that look like damage. Multiplication tokens can be `x`, `X`, or `*`; `+` is treated
     * as addition. Other text is ignored.
     */
    fun calculateTotalDamagePercent(descTemplate: String?, values: Map<String, Number>): Double {
        if (descTemplate.isNullOrBlank()) return 0.0

        val substituted = substitute(descTemplate, values)
        return substituted.lineSequence()
            .map { it.trim() }
            .filter { it.isNotEmpty() && looksLikeDamageLine(it) }
            .map { evaluateExpression(it) }
            .sum()
    }

    /**
     * Converts a summed damage percent into a skill coefficient usable by the DPS formula.
     * - If percent is very large (common in DnF data), heuristically down-scales to avoid
     *   double-counting hidden 10x/100x encodings, matching existing normalization rules.
     */
    fun toSkillCoefficient(totalDamagePercent: Double): Double {
        if (totalDamagePercent <= 0) return 0.0
        // Consistent normalization: Assume values > 100 are percentages (e.g. 4500 = 4500% -> 45.0)
        // Values <= 100 might be small multipliers (e.g. 5 = 500% or 5 hits).
        // However, calculateTotalDamagePercent usually returns raw sums from "{value}%".
        // So 100% is 100.
        // We will assume anything clearly above 1.0 is a percent representation if it came from the generic calculator.
        // But to be safe and match legacy > 5000 logic:
        // We should just divide by 100 if it's substantial.
        val normalized = when {
            totalDamagePercent > 100 -> totalDamagePercent / 100.0
            else -> totalDamagePercent
        }
        return normalized
    }

    private fun substitute(descTemplate: String, values: Map<String, Number>): String {
        val regex = Regex("""\{(value\d+)\}""")
        return regex.replace(descTemplate) { match ->
            val key = match.groupValues.getOrNull(1)
            val number = key?.let { values[it]?.toString() } ?: "0"
            number
        }
    }

    private fun looksLikeDamageLine(line: String): Boolean {
        val lower = line.lowercase()
        return keywordTokens.any { lower.contains(it) }
    }

    /**
     * Evaluates a simplified arithmetic expression inside a line: products joined by `x|X|*`
     * and sums joined by `+`. Non-numeric text is ignored.
     */
    private fun evaluateExpression(line: String): Double {
        if (line.isBlank()) return 0.0
        val normalized = buildString {
            line.forEach { ch ->
                when {
                    ch.isDigit() || ch == '.' -> append(ch)
                    ch == 'x' || ch == 'X' || ch == '*' -> append('*')
                    ch == '+' -> append('+')
                    ch == ',' || ch == '%' || ch.isWhitespace() -> append(' ')
                    else -> append(' ')
                }
            }
        }

        val terms = normalized.split('+').map { it.trim() }.filter { it.isNotEmpty() }
        if (terms.isEmpty()) return 0.0

        var sum = 0.0
        for (term in terms) {
            val factors = term.split('*').mapNotNull { part ->
                part.trim().takeIf { it.isNotEmpty() }?.toDoubleOrNull()
            }
            if (factors.isEmpty()) continue
            val product = factors.fold(1.0) { acc, value -> acc * value }
            sum += product
        }
        return sum
    }
}
