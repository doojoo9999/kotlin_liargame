import {apiClient} from '../../../shared/api/apiClient';

export interface SubmitFinalVotePayload {
  gameNumber: number;
  vote: boolean; // true for 'Yes' (eliminate), false for 'No' (survive)
}

export const submitFinalVote = async (data: SubmitFinalVotePayload): Promise<void> => {
  const { gameNumber, vote } = data;
  // Assuming the endpoint structure based on common REST patterns.
  // This might need to be adjusted based on the actual backend API.
  await apiClient.post(`/api/v1/game/${gameNumber}/vote/final`, { vote });
};
