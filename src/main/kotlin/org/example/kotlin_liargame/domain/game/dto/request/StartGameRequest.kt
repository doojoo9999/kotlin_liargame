package org.example.kotlin_liargame.domain.game.dto.request

data class StartGameRequest(
    val subjectIds: List<Long>? = null,
    val useAllSubjects: Boolean = false,
    val useRandomSubjects: Boolean = false,
    val randomSubjectCount: Int? = null
) {
    fun validate() {
        if (subjectIds != null) {
            if (subjectIds.isEmpty()) {
                throw IllegalArgumentException("���� ID ����� ������ ��� ��� ���� �� �����ϴ�")
            }
            
            subjectIds.forEach { subjectId ->
                if (subjectId <= 0) {
                    throw IllegalArgumentException("���� ID�� ������� �մϴ�")
                }
            }
        }
        
        val selectionMethods = listOf(
            subjectIds != null,
            useAllSubjects,
            useRandomSubjects
        ).count { it }
        
        if (selectionMethods > 1) {
            throw IllegalArgumentException("�� ���� �ϳ��� ���� ���� ����� ����� �� �ֽ��ϴ�")
        }
        
        if (selectionMethods == 0) {
            throw IllegalArgumentException("��� �ϳ��� ���� ���� ����� �����ؾ� �մϴ�")
        }
        if (useRandomSubjects && randomSubjectCount != null && randomSubjectCount <= 0) {
            throw IllegalArgumentException("������ ���� ���� ������� �մϴ�")
        }
    }
}