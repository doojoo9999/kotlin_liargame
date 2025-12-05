package org.example.kotlin_liargame

import org.example.dnf_raid.config.DnfApiProperties
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

@SpringBootApplication(
    scanBasePackages = [
        "org.example.kotlin_liargame",
        "org.example.lineagew",
        "org.example.dnf_raid"
    ]
)
@EntityScan(basePackages = ["org.example.kotlin_liargame", "org.example.lineagew", "org.example.dnf_raid"])
@EnableJpaRepositories(basePackages = ["org.example.kotlin_liargame", "org.example.lineagew", "org.example.dnf_raid"])
@EnableJpaAuditing
@EnableCaching
@EnableConfigurationProperties(
    value = [
        GameProperties::class,
        GameStateStorageProperties::class,
        LineagewAdminProperties::class,
        DnfApiProperties::class
    ]
)
class KotlinLiargameApplication

fun main(args: Array<String>) {
    runApplication<KotlinLiargameApplication>(*args)
}

