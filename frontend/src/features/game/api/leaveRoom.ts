import {apiClient} from '../../../shared/api/apiClient';

export interface LeaveRoomPayload {
  gameNumber: number;
}

export const leaveRoom = async (data: LeaveRoomPayload): Promise<boolean> => {
  const response = await apiClient.post<boolean>('/api/v1/game/leave', data);
  return response.data;
};
