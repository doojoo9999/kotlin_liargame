import {apiClient} from '../../../shared/api/apiClient';
import type {CreateRoomFormInputs} from '../ui/createRoomSchema';

// This payload should match the form inputs and the backend DTO
export type CreateRoomPayload = CreateRoomFormInputs;

export const createRoom = async (data: CreateRoomPayload): Promise<number> => {
  const response = await apiClient.post<number>('/api/v1/game/create', data);
  return response.data;
};
