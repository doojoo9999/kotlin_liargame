package org.example.kotlin_liargame.global.network

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "proxy.trust")
class ProxyTrustProperties(
    var enabled: Boolean = true,
    var trustedProxies: List<String> = emptyList(), // 개별 IP
    var trustedCidrs: List<String> = listOf("127.0.0.1/32", "::1/128"),
    var maxForwardedChain: Int = 5
)
