package org.example.kotlin_liargame.global.security

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import jakarta.servlet.http.HttpSession
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpSession

class SessionDataManagerTest {

    private lateinit var objectMapper: ObjectMapper
    private lateinit var sessionDataManager: SessionDataManager
    private lateinit var session: HttpSession

    @BeforeEach
    fun setUp() {
        objectMapper = ObjectMapper()
            .registerModule(JavaTimeModule())
            .registerModule(KotlinModule.Builder().build())
        sessionDataManager = SessionDataManager(objectMapper)
        session = MockHttpSession()
    }

    @Test
    fun `getSessionData returns existing instance stored in session`() {
        val expected = UserSessionData(userId = 42L, nickname = "legacyUser")
        session.setAttribute("session_user_data", expected)

        val actual = sessionDataManager.getUserSession(session)

        assertThat(actual).isNotNull
        assertThat(actual?.userId).isEqualTo(expected.userId)
        assertThat(actual?.nickname).isEqualTo(expected.nickname)
    }

    @Test
    fun `getSessionData decodes json payload stored as byte array`() {
        val expected = UserSessionData(userId = 99L, nickname = "byteUser")
        val bytePayload = objectMapper.writeValueAsBytes(expected)
        session.setAttribute("session_user_data", bytePayload)

        val actual = sessionDataManager.getUserSession(session)

        assertThat(actual).isNotNull
        assertThat(actual?.userId).isEqualTo(expected.userId)
        assertThat(actual?.nickname).isEqualTo(expected.nickname)
    }
}
