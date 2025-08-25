package org.example.kotlin_liargame.common.validation

import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import kotlin.reflect.KClass

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [ValidLiarCountValidator::class])
annotation class ValidLiarCount(
    val message: String = "라이어 수는 참가자 수보다 적어야 합니다",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class ValidLiarCountValidator : ConstraintValidator<ValidLiarCount, Any> {
    override fun isValid(value: Any?, context: ConstraintValidatorContext?): Boolean {
        if (value == null) return true

        return try {
            val gameLiarCountField = value::class.java.getDeclaredField("gameLiarCount")
            val gameParticipantsField = value::class.java.getDeclaredField("gameParticipants")

            gameLiarCountField.isAccessible = true
            gameParticipantsField.isAccessible = true

            val gameLiarCount = gameLiarCountField.get(value) as Int
            val gameParticipants = gameParticipantsField.get(value) as Int

            gameLiarCount in 1 until gameParticipants
        } catch (e: Exception) {
            false
        }
    }
}