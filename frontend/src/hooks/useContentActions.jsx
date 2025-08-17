import React, {useCallback} from 'react';
import {IconCheck, IconX} from "@tabler/icons-react";

/**
 * Custom hook for content-related business logic
 * @param {Object} dependencies - Required dependencies
 * @param {Function} dependencies.addSubject - Add subject function
 * @param {Function} dependencies.addWord - Add word function
 * @param {Array} dependencies.subjects - Available subjects array
 * @param {Object} dependencies.notifications - The notifications object from @mantine/notifications
 * @returns {Object} Object containing content action functions
 */
export const useContentActions = ({
                                      addSubject,
                                      addWord,
                                      subjects = [],
                                      notifications,
                                  }) => {
    /**
     * Handle adding a new subject
     * @param {string} newSubject - New subject name
     * @param {Function} resetNewSubject - Function to reset new subject field
     */
    const handleAddSubject = useCallback(async (newSubject, resetNewSubject) => {
        // Defensive check for notification system
        const showNotification = (options) => {
            if (notifications && typeof notifications.show === 'function') {
                notifications.show(options);
            } else {
                console.error('Notification system not available. Message:', options.message);
            }
        };

        if (!newSubject.trim()) {
            showNotification({
                title: '입력 오류',
                message: '주제를 입력해주세요.',
                color: 'orange',
                icon: <IconX size={18} />,
            });
            return;
        }

        const existingSubject = subjects.find(s =>
            s &&
            s.name &&
            typeof s.name === 'string' &&
            s.name.toLowerCase() === newSubject.trim().toLowerCase()
        );
        if (existingSubject) {
            showNotification({
                title: '중복 오류',
                message: '이미 존재하는 주제입니다.',
                color: 'orange',
                icon: <IconX size={18} />,
            });
            return;
        }

        try {
            const subjectName = newSubject.trim();
            await addSubject(subjectName);
            showNotification({
                title: '성공',
                message: `주제 '${subjectName}'이(가) 성공적으로 추가되었습니다.`,
                color: 'teal',
                icon: <IconCheck size={18} />,
                styles: (theme) => ({
                    root: { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)', border: `1px solid ${theme.colors.teal[6]}` },
                    title: { color: theme.white },
                    description: { color: theme.colors.gray[3] },
                    closeButton: { color: theme.white },
                }),
            });
            if (resetNewSubject) resetNewSubject();
        } catch (error) {
            const errorMessage = error.response?.data?.message || '주제 추가에 실패했습니다.';
            showNotification({
                title: '오류 발생',
                message: errorMessage,
                color: 'red',
                icon: <IconX size={18} />,
                styles: (theme) => ({
                    root: { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)', border: `1px solid ${theme.colors.red[6]}` },
                    title: { color: theme.white },
                    description: { color: theme.colors.gray[3] },
                    closeButton: { color: theme.white },
                }),
            });
        }
    }, [addSubject, subjects, notifications]);

    /**
     * Handle adding a new word to a subject
     * @param {string} selectedSubject - Selected subject ID
     * @param {string} newWord - New word to add
     * @param {Function} resetNewWord - Function to reset new word field
     */
    const handleAddWord = useCallback(async (selectedSubject, newWord, resetNewWord) => {
        // Defensive check for notification system
        const showNotification = (options) => {
            if (notifications && typeof notifications.show === 'function') {
                notifications.show(options);
            } else {
                console.error('Notification system not available. Message:', options.message);
            }
        };

        if (!selectedSubject) {
            showNotification({ title: '선택 오류', message: '주제를 선택해주세요.', color: 'orange', icon: <IconX size={18} /> });
            return;
        }
        if (!newWord.trim()) {
            showNotification({ title: '입력 오류', message: '답안을 입력해주세요.', color: 'orange', icon: <IconX size={18} /> });
            return;
        }

        try {
            // Ensure subject is a string name/content as required by backend
            const subjectName = typeof selectedSubject === 'string'
                ? selectedSubject
                : (selectedSubject?.name || selectedSubject?.content || selectedSubject?.label || String(selectedSubject));

            await addWord(subjectName.trim(), newWord.trim());

            showNotification({
                title: '성공',
                message: `단어 '${newWord.trim()}'이(가) 성공적으로 추가되었습니다.`,
                color: 'teal',
                icon: <IconCheck size={18} />,
                styles: (theme) => ({
                    root: { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)', border: `1px solid ${theme.colors.teal[6]}` },
                    title: { color: theme.white },
                    description: { color: theme.colors.gray[3] },
                    closeButton: { color: theme.white },
                }),
            });
            if (resetNewWord) resetNewWord();
        } catch (error) {
            const errorMessage = error.response?.data?.message || '단어 추가에 실패했습니다.';
            showNotification({
                title: '오류 발생',
                message: errorMessage,
                color: 'red',
                icon: <IconX size={18} />,
                styles: (theme) => ({
                    root: { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)', border: `1px solid ${theme.colors.red[6]}` },
                    title: { color: theme.white },
                    description: { color: theme.colors.gray[3] },
                    closeButton: { color: theme.white },
                }),
            });
        }
    }, [addWord, notifications]);

    return {
        handleAddSubject,
        handleAddWord
    }
}