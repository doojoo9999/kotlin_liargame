import {apiClient} from '../../../shared/api/apiClient';
import type {GameRoom} from '../types';

// Type definition for the raw response from the backend API
interface BackendGameRoomInfo {
  gameNumber: number;
  title: string;
  host: string;
  currentPlayers: number;
  maxPlayers: number;
  hasPassword: boolean;
  state: 'WAITING' | 'IN_PROGRESS' | string; // Allow other states as well
}

interface GameRoomListResponse {
  gameRooms: BackendGameRoomInfo[];
}

export const getRooms = async (): Promise<GameRoom[]> => {
  const response = await apiClient.get<GameRoomListResponse>('/api/v1/game/rooms');
  
  // Map the backend response to the frontend's data model (GameRoom)
  return response.data.gameRooms.map((room) => ({
    gameNumber: room.gameNumber,
    title: room.title,
    maxPlayers: room.maxPlayers,
    currentPlayers: room.currentPlayers,
    isPrivate: room.hasPassword,
    status: room.state === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'WAITING',
  }));
};
