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
  subjectId: string;
}

// 백엔드 형식에 맞는 요청 인터페이스
interface BackendWordCreateRequest {
  subject: string;  // 주제명 (String)
  word: string;     // 답안 내용 (String)
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
      const response = await apiClient.get<Word[]>('/api/v1/words/wlist');
      // 백엔드에서 배열을 직접 반환하므로 감싸서 반환
      const words = Array.isArray(response) ? response : [];
      
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
  async createWord(wordData: WordCreateRequest, subjectId?: number): Promise<Word> {
    try {
      // subjectName이 제공되지 않은 경우 subjectService에서 가져오기
      if (!subjectId) {
        const { subjectService } = await import('./subjectApi');
        const subjectsResponse = await subjectService.getSubjects();
        const targetSubject = subjectsResponse.subjects.find(s => s.id === wordData.subjectId);
        
        if (!targetSubject) {
          throw new Error(`주제 ID ${wordData.subjectId}를 찾을 수 없습니다.`);
        }
        
        subjectId = targetSubject.id;
      }

      // 백엔드 형식에 맞는 요청 데이터 구성
      const backendRequest: BackendWordCreateRequest = {
        subject: subjectId,
        word: wordData.content
      };

      // 요청 페이로드 로깅
      console.log('Creating word with payload:', {
        originalPayload: wordData,
        backendPayload: backendRequest,
        subjectName: subjectId
      });

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