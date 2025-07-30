package org.example.kotlin_liargame.tools.security

import org.example.kotlin_liargame.tools.security.jwt.JwtAuthenticationFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig(
    private val jwtAuthenticationFilter: JwtAuthenticationFilter
) {

    private val allowedUris = arrayOf(
        "/api/v1/auth/**",
        "/swagger-ui/**",
        "/swagger-resources/**",
        "/api/v1/**",
        "/v3/api-docs/**",
        "/error",
        "/h2-console",
        "/ws/**",
    )

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .csrf { it.disable() }
            .cors {
                it.configurationSource {
                    val config = CorsConfiguration()
                    config.allowedOrigins = listOf("http://localhost:5173")
                    config.allowedMethods = listOf("*")
                    config.allowedHeaders = listOf("*")
                    config.allowCredentials = true
                    config.setAllowedOriginPatterns(listOf("*"))
                    config.addAllowedOrigin("ws://localhost:20021")
                    config.addAllowedOrigin("wss://localhost:20021")
                    config.addAllowedOrigin("http://localhost:20021")
                    config.addAllowedOrigin("https://localhost:20021")
                    config
                }
            }
            .headers { it.frameOptions { options -> options.sameOrigin() } }
            .headers { headers -> headers.frameOptions { frameOptions -> frameOptions.sameOrigin() } }
            .authorizeHttpRequests { auth ->
                auth.requestMatchers(
                    *allowedUris
                ).permitAll()
                    .anyRequest().authenticated()
            }
            .sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            }
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)
            .build()
    }

}