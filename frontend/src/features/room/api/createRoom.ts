import {apiClient} from '../../../shared/api/apiClient';

// Based on the backend DTO CreateGameRoomRequest
export interface CreateRoomPayload {
  gameName: string;
  gamePassword?: string;
  gameParticipants: number;
  // Add other fields like gameTotalRounds, gameLiarCount etc. if needed
}

export const createRoom = async (data: CreateRoomPayload): Promise<number> => {
  const response = await apiClient.post<number>('/api/v1/game/create', data);
  return response.data;
};
