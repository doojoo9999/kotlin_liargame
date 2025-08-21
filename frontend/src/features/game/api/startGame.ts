import {apiClient} from '../../../shared/api/apiClient';
import type {GameStateResponse} from '../../room/types';

export const startGame = async (): Promise<GameStateResponse> => {
  // The backend endpoint for starting a game doesn't require a request body,
  // but it relies on the user's session to identify the game and the user.
  const response = await apiClient.post<GameStateResponse>('/api/v1/game/start');
  return response.data;
};
