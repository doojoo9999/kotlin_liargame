import {apiClient} from '../../../shared/api/apiClient';
import type {GameStateResponse} from '../types'; // We'll create/update this type next

export interface JoinRoomPayload {
  gameNumber: number;
  gamePassword?: string;
  nickname: string | null;
}

export const joinRoom = async (data: JoinRoomPayload): Promise<GameStateResponse> => {
  const response = await apiClient.post<GameStateResponse>('/api/v1/game/join', data);
  return response.data;
};
