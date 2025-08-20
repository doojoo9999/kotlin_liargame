package org.example.kotlin_liargame

import org.example.kotlin_liargame.global.config.GameProperties
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession

@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
@EnableRedisHttpSession
@EnableConfigurationProperties(GameProperties::class)
class KotlinLiargameApplication

fun main(args: Array<String>) {
    runApplication<KotlinLiargameApplication>(*args)
}

