package org.example.kotlin_liargame.global.config

import io.github.cdimascio.dotenv.Dotenv
import org.springframework.boot.SpringApplication
import org.springframework.boot.env.EnvironmentPostProcessor
import org.springframework.core.env.ConfigurableEnvironment
import org.springframework.core.env.MapPropertySource

class DotenvEnvironmentPostProcessor : EnvironmentPostProcessor {
	override fun postProcessEnvironment(environment: ConfigurableEnvironment, application: SpringApplication) {
		val dotenv = Dotenv.configure()
			.ignoreIfMalformed()
			.ignoreIfMissing()
			.directory(".")
			.filename("..env")
			.load()

		val entries = dotenv.entries()
		if (entries.isNotEmpty()) {
			val props = entries.associate { entry ->
				val raw = entry.value.trim()
				val cleaned = if ((raw.startsWith("\"") && raw.endsWith("\"")) || (raw.startsWith("'") && raw.endsWith("'"))) {
					raw.substring(1, raw.length - 1)
				} else raw
				entry.key to cleaned
			}
			environment.propertySources.addFirst(MapPropertySource("dotenv", props))
		}
	}
}
