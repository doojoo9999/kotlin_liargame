import {apiClient} from '../../../shared/api/apiClient';
import type {GameStateResponse} from '../../room/types';

export interface EndDefensePayload {
  gameNumber: number;
}

export const endDefense = async (data: EndDefensePayload): Promise<GameStateResponse> => {
  const response = await apiClient.post<GameStateResponse>('/api/v1/game/defense/end', data);
  return response.data;
};