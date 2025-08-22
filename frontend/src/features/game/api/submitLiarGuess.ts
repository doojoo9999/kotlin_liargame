import {apiClient} from '../../../shared/api/apiClient';

export interface SubmitLiarGuessPayload {
  gameNumber: number;
  guess: string;
}

export const submitLiarGuess = async (data: SubmitLiarGuessPayload): Promise<void> => {
  const { gameNumber, guess } = data;
  await apiClient.post(`/api/v1/game/${gameNumber}/guess`, { guess });
};
