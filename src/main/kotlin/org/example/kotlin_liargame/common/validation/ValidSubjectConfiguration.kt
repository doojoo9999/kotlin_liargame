package org.example.kotlin_liargame.common.validation

import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import kotlin.reflect.KClass

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [ValidSubjectConfigurationValidator::class])
annotation class ValidSubjectConfiguration(
    val message: String = "주제 설정이 올바르지 않습니다",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class ValidSubjectConfigurationValidator : ConstraintValidator<ValidSubjectConfiguration, Any> {
    override fun isValid(value: Any?, context: ConstraintValidatorContext?): Boolean {
        if (value == null) return true
        
        return try {
            val clazz = value::class.java
            
            // CreateGameRoomRequest 검증
            if (hasField(clazz, "useRandomSubjects")) {
                return validateCreateGameRoomRequest(value, context)
            }
            
            // StartGameRequest 검증
            if (hasField(clazz, "useAllSubjects")) {
                return validateStartGameRequest(value, context)
            }
            
            true
        } catch (e: Exception) {
            false
        }
    }
    
    private fun validateCreateGameRoomRequest(value: Any, context: ConstraintValidatorContext?): Boolean {
        val clazz = value::class.java
        
        val useRandomSubjectsField = clazz.getDeclaredField("useRandomSubjects")
        val subjectIdsField = clazz.getDeclaredField("subjectIds")
        val randomSubjectCountField = clazz.getDeclaredField("randomSubjectCount")
        
        useRandomSubjectsField.isAccessible = true
        subjectIdsField.isAccessible = true
        randomSubjectCountField.isAccessible = true
        
        val useRandomSubjects = useRandomSubjectsField.get(value) as Boolean
        val subjectIds = subjectIdsField.get(value) as? List<*>
        val randomSubjectCount = randomSubjectCountField.get(value) as? Int
        
        return if (useRandomSubjects) {
            randomSubjectCount != null && randomSubjectCount > 0
        } else {
            !subjectIds.isNullOrEmpty()
        }
    }
    
    private fun validateStartGameRequest(value: Any, context: ConstraintValidatorContext?): Boolean {
        val clazz = value::class.java
        
        val subjectIdsField = clazz.getDeclaredField("subjectIds")
        val useAllSubjectsField = clazz.getDeclaredField("useAllSubjects")
        val useRandomSubjectsField = clazz.getDeclaredField("useRandomSubjects")
        val randomSubjectCountField = clazz.getDeclaredField("randomSubjectCount")
        
        subjectIdsField.isAccessible = true
        useAllSubjectsField.isAccessible = true
        useRandomSubjectsField.isAccessible = true
        randomSubjectCountField.isAccessible = true
        
        val subjectIds = subjectIdsField.get(value) as? List<*>
        val useAllSubjects = useAllSubjectsField.get(value) as Boolean
        val useRandomSubjects = useRandomSubjectsField.get(value) as Boolean
        val randomSubjectCount = randomSubjectCountField.get(value) as? Int
        
        // 한 번에 하나의 주제 선택 방법만 사용해야 함
        val selectionMethods = listOf(
            subjectIds != null && subjectIds.isNotEmpty(),
            useAllSubjects,
            useRandomSubjects
        )
        
        if (selectionMethods.count { it } != 1) {
            context?.disableDefaultConstraintViolation()
            context?.buildConstraintViolationWithTemplate("한 번에 하나의 주제 선택 방법만 사용해야 합니다")
                ?.addConstraintViolation()
            return false
        }
        
        // subjectIds가 제공된 경우 모든 ID가 양수여야 함
        if (subjectIds != null && subjectIds.isNotEmpty()) {
            val hasInvalidId = subjectIds.any { id ->
                when (id) {
                    is Long -> id <= 0
                    is Int -> id <= 0
                    else -> true
                }
            }
            if (hasInvalidId) {
                context?.disableDefaultConstraintViolation()
                context?.buildConstraintViolationWithTemplate("주제 ID는 양수여야 합니다")
                    ?.addConstraintViolation()
                return false
            }
        }
        
        // 랜덤 주제 선택 시 개수가 양수여야 함
        if (useRandomSubjects && (randomSubjectCount == null || randomSubjectCount <= 0)) {
            context?.disableDefaultConstraintViolation()
            context?.buildConstraintViolationWithTemplate("랜덤으로 선택할 주제 수는 양수여야 합니다")
                ?.addConstraintViolation()
            return false
        }
        
        return true
    }
    
    private fun hasField(clazz: Class<*>, fieldName: String): Boolean {
        return try {
            clazz.getDeclaredField(fieldName)
            true
        } catch (e: NoSuchFieldException) {
            false
        }
    }
}