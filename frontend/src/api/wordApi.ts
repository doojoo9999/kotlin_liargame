import {apiClient} from './client';

export interface Word {
  id: number;
  content: string;
  subjectContent: string;
  createdAt?: string;
  // 프론트엔드 호환성을 위한 별칭 필드들
  word?: string;
  subjectTitle?: string;
  subjectId?: number;
}

export interface WordCreateRequest {
  word: string;
  subjectId: number;
}

export interface WordListResponse {
  words: Word[];
  totalCount: number;
}

export class WordService {
  private static instance: WordService;

  static getInstance(): WordService {
    if (!WordService.instance) {
      WordService.instance = new WordService();
    }
    return WordService.instance;
  }

  // 답안 목록 조회
  async getWords(): Promise<WordListResponse> {
    try {
      const response = await apiClient.get<Word[]>('/api/v1/words/wlist');
      // 백엔드에서 배열을 직접 반환하므로 감싸서 반환하고 별칭 필드 추가
      const words = Array.isArray(response) ? response.map(word => ({
        ...word,
        word: word.content,
        subjectTitle: word.subjectContent,
        subjectId: 0 // TODO: 백엔드에서 subjectId 제공 필요
      })) : [];
      
      return {
        words,
        totalCount: words.length
      };
    } catch (error) {
      console.error('Failed to fetch words:', error);
      throw error;
    }
  }

  // 답안 생성
  async createWord(wordData: WordCreateRequest): Promise<Word> {
    try {
      const response = await apiClient.post<Word>('/api/v1/words/applyw', wordData);
      return response;
    } catch (error) {
      console.error('Failed to create word:', error);
      throw error;
    }
  }

  // 답안 삭제
  async deleteWord(id: number): Promise<void> {
    try {
      await apiClient.delete<void>(`/api/v1/words/delw/${id}`);
    } catch (error) {
      console.error('Failed to delete word:', error);
      throw error;
    }
  }
}

export const wordService = WordService.getInstance();
export const wordApi = wordService;