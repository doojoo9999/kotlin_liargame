import apiClient from '../apiClient';

// Add a new subject. Ensures the backend receives exactly { name: string }
export function addSubject(name) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) {
    throw new Error('주제 이름은 비워둘 수 없습니다.');
  }
  return apiClient.post('/subjects/applysubj', { name: trimmed });
}

// Add a new word to a subject. Keeps existing contract { subject, word }
export function addWord(subject, word) {
  const s = (subject ?? '').trim();
  const w = (word ?? '').trim();
  if (!s || !w) {
    throw new Error('주제와 단어는 비워둘 수 없습니다.');
  }
  return apiClient.post('/words/applyw', { subject: s, word: w });
}
