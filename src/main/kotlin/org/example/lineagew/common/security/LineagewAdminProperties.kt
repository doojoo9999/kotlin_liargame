package org.example.lineagew.common.security

import org.springframework.boot.context.properties.ConfigurationProperties

private const val DEFAULT_HEADER = "X-Lineage-Admin-Key"

@ConfigurationProperties(prefix = "lineagew.admin")
data class LineagewAdminProperties(
    val headerName: String = DEFAULT_HEADER,
    val key: String = ""
) {
    fun resolvedHeaderName(): String = headerName.ifBlank { DEFAULT_HEADER }

    fun isConfigured(): Boolean = key.isNotBlank()
}
