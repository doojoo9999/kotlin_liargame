import {apiClient} from '../../../shared/api/apiClient';

export interface ApplySubjectResponse {
  success: boolean;
  id: number;
  name: string;
}

export const applySubject = async (name: string): Promise<ApplySubjectResponse> => {
  const { data } = await apiClient.post<ApplySubjectResponse>('/api/v1/subjects/applysubj', { name });
  return data;
};
