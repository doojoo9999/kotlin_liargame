import {apiClient} from '../../../shared/api/apiClient';
import type {GameStateResponse} from '../../room/types';

export interface SubmitHintPayload {
  gameNumber: number;
  hint: string;
}

export const submitHint = async (data: SubmitHintPayload): Promise<GameStateResponse> => {
  const response = await apiClient.post<GameStateResponse>('/api/v1/game/hint', data);
  return response.data;
};
