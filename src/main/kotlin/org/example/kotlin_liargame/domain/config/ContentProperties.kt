package org.example.kotlin_liargame.domain.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component

@Component
@ConfigurationProperties(prefix = "app.content")
data class ContentProperties(
    var manualApprovalRequired: Boolean = true
)
