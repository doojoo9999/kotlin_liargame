import {apiClient} from './client';

export interface Subject {
  id: number;
  name: string;
  wordIds: number[];
  description?: string;
  createdAt?: string;
  wordCount?: number;
  title?: string; // name의 별칭
}

export interface SubjectCreateRequest {
  name: string; // 백엔드에서 기대하는 필드명
}

export interface SubjectListResponse {
  subjects: Subject[];
  totalCount?: number;
}

export class SubjectService {
  private static instance: SubjectService;

  static getInstance(): SubjectService {
    if (!SubjectService.instance) {
      SubjectService.instance = new SubjectService();
    }
    return SubjectService.instance;
  }

  // 주제 목록 조회
  async getSubjects(): Promise<SubjectListResponse> {
    try {
      const response = await apiClient.get<Subject[]>('/api/v1/subjects/listsubj');
      // 백엔드에서 배열을 직접 반환하므로 감싸서 반환하고 title 필드 추가
      const subjects = Array.isArray(response) ? response.map(subject => ({
        ...subject,
        title: subject.name,
        wordCount: subject.wordIds?.length || 0
      })) : [];
      
      return {
        subjects,
        totalCount: subjects.length
      };
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      throw error;
    }
  }

  // 주제 생성
  async createSubject(subjectData: SubjectCreateRequest): Promise<Subject> {
    try {
      // 백엔드는 {success: true, id: number, name: string} 형식으로 응답
      const response = await apiClient.post<{success: boolean, id: number, name: string}>('/api/v1/subjects/applysubj', subjectData);
      
      // Subject 형식으로 변환하여 반환
      return {
        id: response.id,
        name: response.name,
        title: response.name,
        wordIds: [],
        wordCount: 0
      };
    } catch (error) {
      console.error('Failed to create subject:', error);
      throw error;
    }
  }

  // 주제 삭제
  async deleteSubject(id: number): Promise<void> {
    try {
      await apiClient.delete<void>(`/api/v1/subjects/delsubj/${id}`);
    } catch (error) {
      console.error('Failed to delete subject:', error);
      throw error;
    }
  }
}

export const subjectService = SubjectService.getInstance();
export const subjectApi = subjectService;