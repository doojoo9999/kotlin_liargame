import {apiService} from './api';
import {API_CONFIG} from '../api/client';
import type {ChatMessage} from './websocketService';
import type {
    DefenseResponse,
    FinalVoteResponse,
    GameResult,
    GuessResponse,
    HintSubmissionResponse,
    RoundEndResponse,
    VoteResponse,
} from '../types/gameFlow';

export class GameFlowService {
  // 힌트 제출
  async submitHint(gameNumber: number, hint: string): Promise<HintSubmissionResponse> {
    try {
      console.log('Submitting hint:', { gameNumber, hint });
      const response = await apiService.post<HintSubmissionResponse>(
        API_CONFIG.ENDPOINTS.GAME.HINT,
        { gameNumber, hint }
      );
      console.log('Hint submitted successfully');
      return response;
    } catch (error) {
      console.error('Failed to submit hint:', error);
      throw error;
    }
  }

  // 라이어 투표
  async castVoteForLiar(gameNumber: number, targetUserId: number): Promise<VoteResponse> {
    try {
      console.log('Casting vote for liar:', { gameNumber, targetUserId });
      const response = await apiService.post<VoteResponse>(
        API_CONFIG.ENDPOINTS.GAME.VOTE,
        { gameNumber, targetUserId }
      );
      console.log('Vote cast successfully:', response);
      return response;
    } catch (error) {
      console.error('Failed to cast vote:', error);
      throw error;
    }
  }

  // 변론 제출
  async submitDefense(gameNumber: number, defenseText: string): Promise<DefenseResponse> {
    try {
      console.log('Submitting defense:', { gameNumber, defenseText });
      const response = await apiService.post<DefenseResponse>(
        API_CONFIG.ENDPOINTS.GAME.SUBMIT_DEFENSE,
        { gameNumber, defenseText }
      );
      console.log('Defense submitted successfully');
      return response;
    } catch (error) {
      console.error('Failed to submit defense:', error);
      throw error;
    }
  }

  // 변론 즉시 종료
  async endDefensePhase(gameNumber: number): Promise<any> {
    try {
      console.log('Ending defense phase:', gameNumber);
      const response = await apiService.post(
        API_CONFIG.ENDPOINTS.GAME.END_DEFENSE,
        { gameNumber }
      );
      console.log('Defense phase ended successfully');
      return response;
    } catch (error) {
      console.error('Failed to end defense phase:', error);
      throw error;
    }
  }

  // 최종 투표 (처형/생존)
  async castFinalVote(gameNumber: number, voteForExecution: boolean): Promise<FinalVoteResponse> {
    try {
      console.log('Casting final vote:', { gameNumber, voteForExecution });
      const response = await apiService.post<FinalVoteResponse>(
        API_CONFIG.ENDPOINTS.GAME.FINAL_VOTE,
        { gameNumber, voteForExecution }
      );
      console.log('Final vote cast successfully');
      return response;
    } catch (error) {
      console.error('Failed to cast final vote:', error);
      throw error;
    }
  }

  // 라이어의 단어 추측
  async guessWord(gameNumber: number, guess: string): Promise<GuessResponse> {
    try {
      console.log('Guessing word:', { gameNumber, guess });
      const response = await apiService.post<GuessResponse>(
        API_CONFIG.ENDPOINTS.GAME.GUESS_WORD,
        { gameNumber, guess }
      );
      console.log('Word guess submitted:', response);
      return response;
    } catch (error) {
      console.error('Failed to guess word:', error);
      throw error;
    }
  }

  // 라운드 종료 처리
  async endRound(gameNumber: number): Promise<RoundEndResponse> {
    try {
      console.log('Ending round:', gameNumber);
      const response = await apiService.post<RoundEndResponse>(
        API_CONFIG.ENDPOINTS.GAME.END_ROUND,
        { gameNumber }
      );
      console.log('Round ended successfully');
      return response;
    } catch (error) {
      console.error('Failed to end round:', error);
      throw error;
    }
  }

  // 게임 결과 조회
  async getGameResult(gameNumber: number): Promise<GameResult> {
    try {
      console.log('Fetching game result:', gameNumber);
      const response = await apiService.get<GameResult>(
        `${API_CONFIG.ENDPOINTS.GAME.RESULT}/${gameNumber}`
      );
      console.log('Game result fetched successfully');
      return response;
    } catch (error) {
      console.error('Failed to fetch game result:', error);
      throw error;
    }
  }

  // 채팅 메시지 전송
  async sendChatMessage(gameNumber: number, message: string, type: 'GENERAL' | 'HINT' | 'DEFENSE' = 'GENERAL'): Promise<void> {
    try {
      console.log('Sending chat message:', { gameNumber, message, type });
      await apiService.post(
        API_CONFIG.ENDPOINTS.CHAT.SEND,
        { gameNumber, message, type }
      );
      console.log('Chat message sent successfully');
    } catch (error) {
      console.error('Failed to send chat message:', error);
      throw error;
    }
  }

  // 채팅 기록 조회
  async getChatHistory(gameNumber: number, limit: number = 50): Promise<ChatMessage[]> {
    try {
      console.log('Fetching chat history:', { gameNumber, limit });
      const response = await apiService.get<ChatMessage[]>(
        `${API_CONFIG.ENDPOINTS.CHAT.HISTORY}?gameNumber=${gameNumber}&limit=${limit}`
      );
      console.log('Chat history fetched successfully');
      return response;
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      throw error;
    }
  }
}

export const gameFlowService = new GameFlowService();
