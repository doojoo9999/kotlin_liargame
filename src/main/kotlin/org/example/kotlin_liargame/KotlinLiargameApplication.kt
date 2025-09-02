package org.example.kotlin_liargame

import org.example.kotlin_liargame.global.config.GameProperties
import org.example.kotlin_liargame.global.network.ProxyTrustProperties
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.cache.annotation.EnableCaching
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
@EnableCaching
@EnableConfigurationProperties(value = [GameProperties::class, ProxyTrustProperties::class])
class KotlinLiargameApplication

fun main(args: Array<String>) {
    runApplication<KotlinLiargameApplication>(*args)
}
