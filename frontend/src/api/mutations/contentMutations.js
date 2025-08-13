import apiClient from '../apiClient';

/**
 * Adds a new subject.
 * @param {string} subjectName - The name of the new subject.
 * @returns {Promise<any>}
 */
export const addSubject = async (subjectName) => {
  return await apiClient.post('/subjects/applysubj', { subject: subjectName });
};

/**
 * Adds a new word to a subject.
 * @param {string} subjectName - The name of the subject.
 * @param {string} word - The new word to add.
 * @returns {Promise<any>}
 */
export const addWord = async (subjectName, word) => {
  return await apiClient.post('/words/applyw', { subject: subjectName, word });
};
