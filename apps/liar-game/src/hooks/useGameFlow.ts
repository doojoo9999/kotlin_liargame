import {useCallback} from 'react';
import {useGameStore} from '../stores';
import {gameFlowService} from '../services/gameFlowService';

export const useGameFlow = () => {
  const {
    gameNumber,
    gamePhase,
    currentPlayer,
    players,
    currentTopic,
    currentWord,
    currentLiar,
    currentTurnPlayerId,
    timer,
    voting,
    chatMessages,
    isLoading,
    error,
    isLiar,
    setLoading,
    setError,
    setChatMessages,
  } = useGameStore();

  // 힌트 제출
  const submitHint = useCallback(async (hint: string) => {
    if (!gameNumber) {
      throw new Error('게임 번호가 없습니다.');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await gameFlowService.submitHint(gameNumber, hint);
      setLoading(false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '힌트 제출에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [gameNumber, setLoading, setError]);

  // 라이어 투표
  const voteForLiar = useCallback(async (targetUserId: number) => {
    if (!gameNumber) {
      throw new Error('게임 번호가 없습니다.');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await gameFlowService.castVoteForLiar(gameNumber, targetUserId);
      setLoading(false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '투표에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [gameNumber, setLoading, setError]);

  // 변론 제출
  const submitDefense = useCallback(async (defenseText: string) => {
    if (!gameNumber) {
      throw new Error('게임 번호가 없습니다.');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await gameFlowService.submitDefense(gameNumber, defenseText);
      setLoading(false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '변론 제출에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [gameNumber, setLoading, setError]);

  // 변론 즉시 종료
  const endDefensePhase = useCallback(async () => {
    if (!gameNumber) {
      throw new Error('게임 번호가 없습니다.');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await gameFlowService.endDefensePhase(gameNumber);
      setLoading(false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '변론 종료에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [gameNumber, setLoading, setError]);

  // 최종 투표 (처형/생존)
  const castFinalVote = useCallback(async (voteForExecution: boolean) => {
    if (!gameNumber) {
      throw new Error('게임 번호가 없습니다.');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await gameFlowService.castFinalVote(gameNumber, voteForExecution);
      setLoading(false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '최종 투표에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [gameNumber, setLoading, setError]);

  // 라이어의 단어 추측
  const guessWord = useCallback(async (guess: string) => {
    if (!gameNumber) {
      throw new Error('게임 번호가 없습니다.');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await gameFlowService.guessWord(gameNumber, guess);
      setLoading(false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '단어 추측에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [gameNumber, setLoading, setError]);

  // 라운드 종료
  const endRound = useCallback(async () => {
    if (!gameNumber) {
      throw new Error('게임 번호가 없습니다.');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await gameFlowService.endRound(gameNumber);
      setLoading(false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '라운드 종료에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [gameNumber, setLoading, setError]);

  // 게임 결과 조회
  const getGameResult = useCallback(async () => {
    if (!gameNumber) {
      throw new Error('게임 번호가 없습니다.');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await gameFlowService.getGameResult(gameNumber);
      setLoading(false);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '게임 결과 조회에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [gameNumber, setLoading, setError]);

  // 채팅 메시지 전송
  const sendChatMessage = useCallback(async (message: string, type: 'GENERAL' | 'HINT' | 'DEFENSE' = 'GENERAL') => {
    if (!gameNumber) {
      throw new Error('게임 번호가 없습니다.');
    }

    try {
      await gameFlowService.sendChatMessage(gameNumber, message, type);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '채팅 메시지 전송에 실패했습니다.';
      setError(errorMessage);
      throw error;
    }
  }, [gameNumber, setError]);

  // 채팅 기록 로드
  const loadChatHistory = useCallback(async (limit: number = 50) => {
    if (!gameNumber) {
      throw new Error('게임 번호가 없습니다.');
    }

    try {
      const messages = await gameFlowService.getChatHistory(gameNumber, limit);
      setChatMessages(messages);
      return messages;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '채팅 기록 로드에 실패했습니다.';
      setError(errorMessage);
      throw error;
    }
  }, [gameNumber, setChatMessages, setError]);

  // 현재 플레이어가 턴인지 확인
  const isMyTurn = useCallback(() => {
    return currentPlayer && currentTurnPlayerId === currentPlayer.id;
  }, [currentPlayer, currentTurnPlayerId]);

  // isLiar is now imported from the store as a boolean property

  // 현재 플레이어가 살아있는지 확인
  const isAlive = useCallback(() => {
    return currentPlayer?.isAlive !== false;
  }, [currentPlayer]);

  // 투표 가능한지 확인
  const canVote = useCallback(() => {
    return voting.isActive && isAlive() && !voting.votes[currentPlayer?.id || ''];
  }, [voting, isAlive, currentPlayer]);

  // 게임 단계별 UI 상태 계산
  const getPhaseInfo = useCallback(() => {
    switch (gamePhase) {
      case 'WAITING_FOR_PLAYERS':
        return {
          title: '플레이어 대기 중',
          description: '게임 시작을 기다리고 있습니다.',
          canAct: false,
        };
      case 'SPEECH':
        return {
          title: '힌트 제공 단계',
          description: isMyTurn() ? '힌트를 제공해주세요.' : '다른 플레이어의 힌트를 기다리고 있습니다.',
          canAct: isMyTurn() && !isLiar,
        };
      case 'VOTING_FOR_LIAR':
        return {
          title: '라이어 투표',
          description: '라이어라고 생각하는 플레이어에게 투표하세요.',
          canAct: canVote(),
        };
      case 'DEFENDING':
        return {
          title: '변론 단계',
          description: currentLiar === currentPlayer?.id ? '변론을 해주세요.' : '변론을 듣고 있습니다.',
          canAct: currentLiar === currentPlayer?.id,
        };
      case 'VOTING_FOR_SURVIVAL':
        return {
          title: '생존 투표',
          description: '의심받는 플레이어를 처형할지 투표하세요.',
          canAct: canVote(),
        };
      case 'GUESSING_WORD':
        return {
          title: '단어 추측',
          description: isLiar ? '단어를 추측해주세요.' : '라이어의 추측을 기다리고 있습니다.',
          canAct: isLiar,
        };
      case 'GAME_OVER':
        return {
          title: '게임 종료',
          description: '게임이 종료되었습니다.',
          canAct: false,
        };
      default:
        return {
          title: '알 수 없는 단계',
          description: '',
          canAct: false,
        };
    }
  }, [gamePhase, isMyTurn, isLiar, canVote, currentLiar, currentPlayer]);

  return {
    // 상태
    gameNumber,
    gamePhase,
    currentPlayer,
    players,
    currentTopic,
    currentWord,
    currentLiar,
    currentTurnPlayerId,
    timer,
    voting,
    chatMessages,
    isLoading,
    error,

    // 게임 플로우 액션
    submitHint,
    voteForLiar,
    submitDefense,
    endDefensePhase,
    castFinalVote,
    guessWord,
    endRound,
    getGameResult,

    // 채팅 액션
    sendChatMessage,
    loadChatHistory,

    // 유틸리티 함수
    isMyTurn,
    isLiar,
    isAlive,
    canVote,
    getPhaseInfo,
  };
};
