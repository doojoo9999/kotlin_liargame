import {apiClient} from '../../../shared/api/apiClient';
import type {GameStateResponse} from '../../room/types';

export interface SubmitVotePayload {
  gameNumber: number;
  targetUserId: number;
}

export const submitVote = async (data: SubmitVotePayload): Promise<GameStateResponse> => {
  const response = await apiClient.post<GameStateResponse>('/api/v1/game/vote', data);
  return response.data;
};
