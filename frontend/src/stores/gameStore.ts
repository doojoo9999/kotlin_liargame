import {create} from 'zustand';
import {devtools} from 'zustand/middleware';
import {websocketService} from '../services/websocketService';
import type {ChatCallback, ChatMessage, ConnectionCallback, EventCallback, GameEvent} from '../types/realtime';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  score: number;
}

export interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  players: Player[];
  maxPlayers: number;
  isStarted: boolean;
  currentRound: number;
  totalRounds: number;
  state: 'WAITING' | 'STARTING' | 'PROVIDING_HINTS' | 'VOTING' | 'DEFENDING' | 'ROUND_ENDED' | 'GAME_ENDED';
}

export interface GameState {
  // Connection state
  isConnected: boolean;
  connectionError: string | null;

  // Current game room
  currentRoom: GameRoom | null;
  currentPlayerId: string | null;

  // Game state
  isLiar: boolean;
  currentCategory: string | null;
  timeRemaining: number;
  hints: Array<{
    playerId: string;
    playerName: string;
    hint: string;
    timestamp: number;
  }>;
  votes: Array<{
    voterId: string;
    voterName: string;
    targetId: string;
    targetName: string;
  }>;
  defenses: Array<{
    defenderId: string;
    defenderName: string;
    defense: string;
    timestamp: number;
  }>;

  // Chat
  chatMessages: ChatMessage[];

  // Available rooms
  availableRooms: GameRoom[];

  // Actions
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;
  joinGame: (gameId: string) => void;
  leaveGame: () => void;
  sendChatMessage: (message: string) => void;
  castVote: (targetPlayerId: string) => void;
  submitDefense: (defense: string) => void;
  startGame: () => void;

  // Internal actions
  setConnectionState: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  handleGameEvent: (event: GameEvent) => void;
  handleChatMessage: (message: ChatMessage) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  addHint: (playerId: string, playerName: string, hint: string) => void;
  addVote: (voterId: string, voterName: string, targetId: string, targetName: string) => void;
  addDefense: (defenderId: string, defenderName: string, defense: string) => void;
  resetGameState: () => void;
}

const useGameStore = create<GameState>()(
  devtools(
    (set, get) => {
      // WebSocket event handlers
      const connectionCallback: ConnectionCallback = (connected) => {
        set({ isConnected: connected });
        if (!connected) {
          set({ connectionError: '실시간 연결이 끊어졌습니다' });
        } else {
          set({ connectionError: null });
        }
      };

      const gameEventCallback: EventCallback = (event) => {
        get().handleGameEvent(event);
      };

      const chatMessageCallback: ChatCallback = (message) => {
        get().handleChatMessage(message);
      };

      // Setup WebSocket listeners
      websocketService.addConnectionCallback(connectionCallback);
      websocketService.onGameEvent('*', gameEventCallback);
      websocketService.onChatMessage(chatMessageCallback);

      return {
        // Initial state
        isConnected: false,
        connectionError: null,
        currentRoom: null,
        currentPlayerId: null,
        isLiar: false,
        currentCategory: null,
        timeRemaining: 0,
        hints: [],
        votes: [],
        defenses: [],
        chatMessages: [],
        availableRooms: [],

        // Actions
        connectWebSocket: async () => {
          try {
            await websocketService.connect();
            set({ connectionError: null });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '연결에 실패했습니다';
            set({ connectionError: errorMessage });
            throw error;
          }
        },

        disconnectWebSocket: () => {
          websocketService.disconnect();
          set({
            isConnected: false,
            currentRoom: null,
            connectionError: null
          });
        },

        joinGame: (gameId: string) => {
          if (!get().isConnected) {
            set({ connectionError: '실시간 연결이 필요합니다' });
            return;
          }

          websocketService.subscribeToGame(gameId);
          // Reset game state when joining new game
          set({
            hints: [],
            votes: [],
            defenses: [],
            chatMessages: [],
            isLiar: false,
            currentCategory: null,
            timeRemaining: 0
          });
        },

        leaveGame: () => {
          const { currentRoom } = get();
          if (currentRoom) {
            websocketService.unsubscribeFromGame(currentRoom.id);
            set({ currentRoom: null });
            get().resetGameState();
          }
        },

        sendChatMessage: (message: string) => {
          const { currentRoom } = get();
          if (currentRoom && get().isConnected) {
            const { nickname } = useAuthStore.getState();
            websocketService.sendChatMessage(currentRoom.id, message, nickname ?? undefined);
          }
        },

        castVote: (targetPlayerId: string) => {
          const { currentRoom } = get();
          if (currentRoom && get().isConnected) {
            websocketService.sendVote(currentRoom.id, targetPlayerId);
          }
        },

        submitDefense: (defense: string) => {
          const { currentRoom } = get();
          if (currentRoom && get().isConnected) {
            websocketService.sendDefense(currentRoom.id, defense);
          }
        },

        startGame: () => {
          const { currentRoom } = get();
          if (currentRoom && get().isConnected) {
            websocketService.sendGameAction(currentRoom.id, 'start');
          }
        },

        // Internal actions
        setConnectionState: (connected: boolean) => {
          set({ isConnected: connected });
        },

        setConnectionError: (error: string | null) => {
          set({ connectionError: error });
        },

        handleGameEvent: (event: GameEvent) => {
          const state = get();

          switch (event.type) {
            case 'PLAYER_JOINED':
              if (state.currentRoom) {
                const newPlayer: Player = {
                  id: event.payload.playerId,
                  name: event.payload.playerName,
                  isHost: event.payload.isHost,
                  isReady: false,
                  isConnected: true,
                  score: 0
                };

                set({
                  currentRoom: {
                    ...state.currentRoom,
                    players: [...state.currentRoom.players, newPlayer]
                  }
                });
              }
              break;

            case 'PLAYER_LEFT':
              if (state.currentRoom) {
                set({
                  currentRoom: {
                    ...state.currentRoom,
                    players: state.currentRoom.players.filter(
                      player => player.id !== event.payload.playerId
                    )
                  }
                });
              }
              break;

            case 'GAME_STARTED':
              set({
                currentRoom: state.currentRoom ? {
                  ...state.currentRoom,
                  isStarted: true,
                  state: 'PROVIDING_HINTS',
                  currentRound: event.payload.currentRound
                } : null
              });
              break;

            case 'ROUND_STARTED':
              set({
                currentCategory: event.payload.category,
                timeRemaining: event.payload.timeLimit,
                isLiar: event.payload.liarId === state.currentPlayerId,
                hints: [],
                votes: [],
                defenses: []
              });
              break;

            case 'HINT_PROVIDED':
              get().addHint(
                event.payload.playerId,
                event.payload.playerName,
                event.payload.hint
              );
              break;

            case 'VOTE_CAST':
              get().addVote(
                event.payload.voterId,
                event.payload.voterName,
                event.payload.targetId,
                event.payload.targetName
              );
              break;

            case 'DEFENSE_SUBMITTED':
              get().addDefense(
                event.payload.defenderId,
                event.payload.defenderName,
                event.payload.defense
              );
              break;

            case 'ROUND_ENDED':
              // Update scores
              if (state.currentRoom) {
                const updatedPlayers = state.currentRoom.players.map(player => {
                  const scoreInfo = event.payload.scores.find(
                    (s: any) => s.playerId === player.id
                  );
                  return scoreInfo ? { ...player, score: scoreInfo.score } : player;
                });

                set({
                  currentRoom: {
                    ...state.currentRoom,
                    players: updatedPlayers,
                    state: 'ROUND_ENDED'
                  }
                });
              }
              break;

            case 'GAME_ENDED':
              if (state.currentRoom) {
                const finalPlayers = state.currentRoom.players.map(player => {
                  const scoreInfo = event.payload.finalScores.find(
                    (s: any) => s.playerId === player.id
                  );
                  return scoreInfo ? { ...player, score: scoreInfo.score } : player;
                });

                set({
                  currentRoom: {
                    ...state.currentRoom,
                    players: finalPlayers,
                    state: 'GAME_ENDED'
                  }
                });
              }
              break;

            case 'GAME_STATE_UPDATED':
              if (state.currentRoom) {
                set({
                  currentRoom: {
                    ...state.currentRoom,
                    state: event.payload.state
                  },
                  timeRemaining: event.payload.timeRemaining || state.timeRemaining
                });
              }
              break;
          }
        },

        handleChatMessage: (message: ChatMessage) => {
          set(state => ({
            chatMessages: [...state.chatMessages, message]
          }));
        },

        updatePlayer: (playerId: string, updates: Partial<Player>) => {
          const state = get();
          if (state.currentRoom) {
            set({
              currentRoom: {
                ...state.currentRoom,
                players: state.currentRoom.players.map(player =>
                  player.id === playerId ? { ...player, ...updates } : player
                )
              }
            });
          }
        },

        addHint: (playerId: string, playerName: string, hint: string) => {
          set(state => ({
            hints: [...state.hints, {
              playerId,
              playerName,
              hint,
              timestamp: Date.now()
            }]
          }));
        },

        addVote: (voterId: string, voterName: string, targetId: string, targetName: string) => {
          set(state => ({
            votes: [...state.votes, {
              voterId,
              voterName,
              targetId,
              targetName
            }]
          }));
        },

        addDefense: (defenderId: string, defenderName: string, defense: string) => {
          set(state => ({
            defenses: [...state.defenses, {
              defenderId,
              defenderName,
              defense,
              timestamp: Date.now()
            }]
          }));
        },

        resetGameState: () => {
          set({
            isLiar: false,
            currentCategory: null,
            timeRemaining: 0,
            hints: [],
            votes: [],
            defenses: [],
            chatMessages: []
          });
        }
      };
    },
    {
      name: 'game-store'
    }
  )
);

export default useGameStore;
