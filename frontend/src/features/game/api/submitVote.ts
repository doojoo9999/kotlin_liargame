import {apiClient} from '../../../shared/api/apiClient';
import type {GameStateResponse} from '../../room/types';

export interface SubmitVotePayload {
  gameNumber: number;
  targetPlayerId: number;  // 백엔드 API와 일치하도록 유지 (API 스펙에 따라)
}

export const submitVote = async (data: SubmitVotePayload): Promise<GameStateResponse> => {
  const response = await apiClient.post<GameStateResponse>('/api/v1/game/vote', data);
  return response.data;
};
