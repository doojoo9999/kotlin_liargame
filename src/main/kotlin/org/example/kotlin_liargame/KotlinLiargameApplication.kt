package org.example.kotlin_liargame

import org.example.kotlin_liargame.global.config.GameProperties
import org.example.kotlin_liargame.global.config.GameStateStorageProperties
import org.example.lineagew.common.security.LineagewAdminProperties
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.cache.annotation.EnableCaching
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication(scanBasePackages = ["org.example.kotlin_liargame", "org.example.lineagew"])
@EntityScan(basePackages = ["org.example.kotlin_liargame", "org.example.lineagew"])
@EnableJpaRepositories(basePackages = ["org.example.kotlin_liargame", "org.example.lineagew"])
@EnableJpaAuditing
@EnableScheduling
@EnableCaching
@EnableConfigurationProperties(value = [GameProperties::class, GameStateStorageProperties::class, LineagewAdminProperties::class])
class KotlinLiargameApplication

fun main(args: Array<String>) {
    runApplication<KotlinLiargameApplication>(*args)
}

