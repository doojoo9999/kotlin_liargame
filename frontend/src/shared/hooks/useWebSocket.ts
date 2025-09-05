import {useCallback, useEffect} from 'react';
import {useAuthStore} from '@/shared/stores/auth.store';
import {useWebSocketStore} from '@/shared/stores/websocket.store';
import {useGameStore} from '@/shared/stores/game.store';
import type {WebSocketEventHandlers} from '@/shared/types/websocket.types';

export const useWebSocketConnection = (gameNumber?: number) => {
  const { token } = useAuthStore();
  const { connect, disconnect, setEventHandlers, isConnected, isConnecting, error } = useWebSocketStore();
  const { updateGamePhase, addPlayer, removePlayer, updatePlayer, addVote, setGameResult } = useGameStore();

  // WebSocket 이벤트 핸들러 설정
  const setupEventHandlers = useCallback(() => {
    const handlers: Partial<WebSocketEventHandlers> = {
      onPlayerJoined: (message) => {
        console.log('Player joined:', message.data);
        addPlayer(message.data);
      },

      onPlayerLeft: (message) => {
        console.log('Player left:', message.data);
        removePlayer(message.data.playerId);
      },

      onGameStarted: (message) => {
        console.log('Game started:', message.data);
        // 게임 상태 전체 업데이트는 다른 훅에서 처리
      },

      onPhaseChanged: (message) => {
        console.log('Phase changed:', message.data);
        updateGamePhase(message.data.gamePhase, message.data.timeRemaining);
      },

      onPlayerVoted: (message) => {
        console.log('Player voted:', message.data);
        addVote(message.data);

        // 투표한 플레이어 상태 업데이트
        updatePlayer(message.data.voterId, { hasVoted: true });

        // 투표받은 플레이어의 투표 수 증가
        const currentGame = useGameStore.getState().currentGame;
        if (currentGame) {
          const targetPlayer = currentGame.players.find(p => p.id === message.data.targetId);
          if (targetPlayer) {
            updatePlayer(message.data.targetId, {
              votesReceived: targetPlayer.votesReceived + 1
            });
          }
        }
      },

      onHintProvided: (message) => {
        console.log('Hint provided:', message.data);
        updatePlayer(message.data.playerId, {
          hint: message.data.hint,
          hasProvidedHint: true
        });
      },

      onGameEnded: (message) => {
        console.log('Game ended:', message.data);
        setGameResult(message.data);
      },

      onPlayerEliminated: (message) => {
        console.log('Player eliminated:', message.data);
        updatePlayer(message.data.playerId, {
          isAlive: false,
          state: 'ELIMINATED'
        });
      },

      onTimeUpdate: (message) => {
        // 시간 업데이트는 현재 게임 상태에 반영
        const currentGame = useGameStore.getState().currentGame;
        if (currentGame) {
          useGameStore.setState({
            currentGame: {
              ...currentGame,
              timeRemaining: message.data.timeRemaining
            }
          });
        }
      },

      onError: (message) => {
        console.error('WebSocket error:', message.data);
        useWebSocketStore.getState().setError(message.data.message);
      },

      onChatMessage: (message) => {
        // 채팅 메시지는 별도 스토어에서 관리
        console.log('Chat message:', message.data);
      },
    };

    setEventHandlers(handlers);
  }, [addPlayer, removePlayer, updatePlayer, updateGamePhase, addVote, setGameResult]);

  // WebSocket 연결
  const connectWebSocket = useCallback(() => {
    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      return;
    }

    const wsUrl = gameNumber
      ? `${import.meta.env.VITE_WS_URL}/game/${gameNumber}`
      : `${import.meta.env.VITE_WS_URL}/lobby`;

    connect(wsUrl, token);
  }, [token, gameNumber, connect]);

  // 컴포넌트 마운트 시 연결 설정
  useEffect(() => {
    setupEventHandlers();

    if (token && !isConnected && !isConnecting) {
      connectWebSocket();
    }

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      disconnect();
    };
  }, [token, isConnected, isConnecting, setupEventHandlers, connectWebSocket, disconnect]);

  // 재연결 함수
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connectWebSocket, 1000);
  }, [disconnect, connectWebSocket]);

  return {
    isConnected,
    isConnecting,
    error,
    reconnect,
  };
};
