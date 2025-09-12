import {apiClient} from './client';

export interface Word {
  id: number;
  content: string;
  subjectId: number;
  subjectName?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
}

export interface WordCreateRequest {
  content: string;
  subjectId: number;
}

// 백엔드 형식에 맞는 요청 인터페이스
interface BackendWordCreateRequest {
  subjectId: number;  // 주제 ID (Number)
  word: string;       // 답안 내용 (String)
}

export interface WordListResponse {
  words: Word[];
  totalCount?: number;
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
      const response = await apiClient.get<any[]>('/api/v1/words/wlist');
      // 백엔드에서 배열을 직접 반환하므로 감싸서 반환하고 필드 매핑
      const words = Array.isArray(response) ? response.map(item => ({
        id: item.id,
        content: item.content,
        subjectId: item.subjectId,
        subjectName: item.subjectContent, // 백엔드의 subjectContent를 subjectName으로 매핑
        status: 'APPROVED' as const // 백엔드에서 승인된 것만 반환하므로
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

  // 특정 주제의 답안 목록 조회
  async getWordsBySubject(subjectId: number): Promise<WordListResponse> {
    try {
      const allWords = await this.getWords();
      const filteredWords = allWords.words.filter(word => word.subjectId === subjectId);
      
      return {
        words: filteredWords,
        totalCount: filteredWords.length
      };
    } catch (error) {
      console.error('Failed to fetch words by subject:', error);
      throw error;
    }
  }

  // 답안 생성
  async createWord(wordData: WordCreateRequest): Promise<Word> {
    try {
      // 백엔드 형식에 맞는 요청 데이터 구성
      const backendRequest: BackendWordCreateRequest = {
        subjectId: wordData.subjectId, // 이미 numeric ID가 전달됨
        word: wordData.content
      };

      // 요청 페이로드 로깅
      console.log('=== Word Creation Request ===');
      console.log('Original payload:', wordData);
      console.log('Backend payload:', backendRequest);
      console.log('SubjectId type:', typeof backendRequest.subjectId);
      console.log('Word type:', typeof backendRequest.word);
      console.log('Request URL: /api/v1/words/applyw');
      console.log('=============================');

      // 백엔드는 {message: string} 형식으로 응답
      const response = await apiClient.post<{message: string}>('/api/v1/words/applyw', backendRequest);
      
      console.log('Word creation successful:', response);
      
      // Word 형식으로 변환하여 반환 (실제 ID는 백엔드에서 제공하지 않으므로 임시 값 사용)
      return {
        id: Date.now(), // 임시 ID (실제로는 목록을 다시 가져와야 함)
        content: wordData.content,
        subjectId: wordData.subjectId,
        status: 'PENDING'
      };
    } catch (error) {
      console.error('Failed to create word:', error);
      
      // 에러 상세 정보 로깅
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // 네트워크 에러의 경우 상세 정보 추출
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error detected - check server connection');
      }

      throw new Error(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
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