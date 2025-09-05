import {create} from 'zustand';
import type {GameResult, GameRoom, Player, VotingRecord} from '@/shared/types/game.types';

interface GameStore {
  // 게임 상태
  currentGame: GameRoom | null;
  players: Player[];
  votingRecords: VotingRecord[];
  gameResult: GameResult | null;

  // 액션
  setCurrentGame: (game: GameRoom) => void;
  updateGamePhase: (phase: string, timeRemaining?: number) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  addVote: (vote: VotingRecord) => void;
  setGameResult: (result: GameResult) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // 초기 상태
  currentGame: null,
  players: [],
  votingRecords: [],
  gameResult: null,

  // 현재 게임 설정
  setCurrentGame: (game: GameRoom) => {
    set({ currentGame: game, players: game.players || [] });
  },

  // 게임 페이즈 업데이트
  updateGamePhase: (phase: string, timeRemaining?: number) => {
    set(state => ({
      currentGame: state.currentGame ? {
        ...state.currentGame,
        gamePhase: phase,
        timeRemaining
      } : null
    }));
  },

  // 플레이어 추가
  addPlayer: (player: Player) => {
    set(state => {
      const newPlayers = [...state.players, player];
      return {
        players: newPlayers,
        currentGame: state.currentGame ? {
          ...state.currentGame,
          players: newPlayers
        } : null
      };
    });
  },

  // 플레이어 제거
  removePlayer: (playerId: string) => {
    set(state => {
      const newPlayers = state.players.filter(p => p.id !== playerId);
      return {
        players: newPlayers,
        currentGame: state.currentGame ? {
          ...state.currentGame,
          players: newPlayers
        } : null
      };
    });
  },

  // 플레이어 정보 업데이트
  updatePlayer: (playerId: string, updates: Partial<Player>) => {
    set(state => {
      const updatedPlayers = state.players.map(player =>
        player.id === playerId ? { ...player, ...updates } : player
      );

      return {
        players: updatedPlayers,
        currentGame: state.currentGame ? {
          ...state.currentGame,
          players: updatedPlayers
        } : null
      };
    });
  },

  // 투표 기록 추가
  addVote: (vote: VotingRecord) => {
    set(state => ({
      votingRecords: [...state.votingRecords, vote]
    }));
  },

  // 게임 결과 설정
  setGameResult: (result: GameResult) => {
    set({ gameResult: result });
  },

  // 게임 상태 초기화
  resetGame: () => {
    set({
      currentGame: null,
      players: [],
      votingRecords: [],
      gameResult: null
    });
  },
}));
