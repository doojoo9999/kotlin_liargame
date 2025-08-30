import {apiClient} from '../../../shared/api/apiClient';
import type {GameStateResponse} from '../../room/types';

export interface SubmitFinalVotePayload {
  gameNumber: number;
  voteForExecution: boolean; // true for 'Yes' (eliminate), false for 'No' (survive)
}

export const submitFinalVote = async (data: SubmitFinalVotePayload): Promise<GameStateResponse> => {
  const response = await apiClient.post<GameStateResponse>('/api/v1/game/vote/final', data);
  return response.data;
};
