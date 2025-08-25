import {apiClient} from '../../../shared/api/apiClient';

export interface ApplyWordRequest {
  subject: string;
  word: string;
}

export interface ApplyWordResponse {
  message: string;
}

export const applyWord = async (payload: ApplyWordRequest): Promise<ApplyWordResponse> => {
  const { data } = await apiClient.post<ApplyWordResponse>('/api/v1/words/applyw', payload);
  return data;
};
