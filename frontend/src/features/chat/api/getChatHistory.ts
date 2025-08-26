import {apiClient} from '../../../shared/api/apiClient';

export interface ChatHistoryResponse {
  id: number;
  playerNickname: string;
  content: string;
  timestamp: string;
  messageType: string;
}

export const getChatHistory = async (gameNumber: number): Promise<ChatHistoryResponse[]> => {
  const response = await apiClient.get(`/api/v1/chat/history?gameNumber=${gameNumber}&limit=50`);
  return response.data;
};
