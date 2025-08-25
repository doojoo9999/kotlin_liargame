import {apiClient} from '../../../shared/api/apiClient';
import type {GameStateResponse} from '../../room/types';

export const getGameState = async (gameNumber: number): Promise<GameStateResponse> => {
  const response = await apiClient.get<GameStateResponse>(`/api/v1/game/${gameNumber}`);
  return response.data;
};
