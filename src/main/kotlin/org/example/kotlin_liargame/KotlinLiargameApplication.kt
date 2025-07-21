package org.example.kotlin_liargame

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import org.springframework.data.jpa.repository.config.EnableJpaRepositories

@SpringBootApplication
@EnableJpaAuditing
class KotlinLiargameApplication

fun main(args: Array<String>) {
    runApplication<KotlinLiargameApplication>(*args)
}
