import {create} from 'zustand';
import {devtools} from 'zustand/middleware';
import {
    type ActiveGame,
    adminApi,
    type AdminLoginRequest,
    type GameStatistics,
    type PendingContent,
    type PlayerInfo,
    type ProfanityRequest
} from '../api/adminApi';
import type {APIResponse} from '@/types';

const ensureSuccess = (response: APIResponse<unknown>, fallbackMessage: string): void => {
  if (!response.success) {
    throw new Error(response.error?.message ?? fallbackMessage);
  }
};

const extractData = <T>(response: APIResponse<T>, fallbackMessage: string): T => {
  ensureSuccess(response, fallbackMessage);
  if (response.data === undefined) {
    throw new Error(fallbackMessage);
  }
  return response.data;
};

interface AdminState {
  // Authentication
  isAuthenticated: boolean;
  adminNickname: string | null;
  
  // Statistics
  statistics: GameStatistics | null;
  statisticsLoading: boolean;
  statisticsError: string | null;
  
  // Games
  activeGames: ActiveGame[];
  gamesLoading: boolean;
  gamesError: string | null;
  
  // Players
  players: PlayerInfo[];
  playersLoading: boolean;
  playersError: string | null;
  
  // Profanity Requests
  profanityRequests: ProfanityRequest[];
  profanityLoading: boolean;
  profanityError: string | null;
  
  // Pending Content
  pendingContent: PendingContent[];
  contentLoading: boolean;
  contentError: string | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
}

interface AdminActions {
  // Authentication
  login: (credentials: AdminLoginRequest) => Promise<void>;
  logout: () => void;
  
  // Statistics
  fetchStatistics: () => Promise<void>;
  
  // Games Management
  fetchActiveGames: () => Promise<void>;
  terminateGame: (gameNumber: number) => Promise<void>;
  kickPlayer: (gameNumber: number, userId: number) => Promise<void>;
  
  // Player Management
  fetchPlayers: () => Promise<void>;
  grantAdminRole: (userId: number) => Promise<void>;
  
  // Profanity Management
  fetchProfanityRequests: () => Promise<void>;
  approveProfanityRequest: (requestId: number) => Promise<void>;
  rejectProfanityRequest: (requestId: number) => Promise<void>;
  
  // Content Management
  fetchPendingContent: () => Promise<void>;
  approveAllContent: () => Promise<void>;
  
  // Cleanup Operations
  cleanupStaleGames: () => Promise<{ cleanedGames: number; message: string }>;
  cleanupDisconnectedPlayers: () => Promise<{ cleanedPlayers: number }>;
  cleanupEmptyGames: () => Promise<{ cleanedGames: number; message: string }>;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type AdminStore = AdminState & AdminActions;

const initialState: AdminState = {
  // Authentication
  isAuthenticated: false,
  adminNickname: null,
  
  // Statistics
  statistics: null,
  statisticsLoading: false,
  statisticsError: null,
  
  // Games
  activeGames: [],
  gamesLoading: false,
  gamesError: null,
  
  // Players
  players: [],
  playersLoading: false,
  playersError: null,
  
  // Profanity Requests
  profanityRequests: [],
  profanityLoading: false,
  profanityError: null,
  
  // Pending Content
  pendingContent: [],
  contentLoading: false,
  contentError: null,
  
  // UI State
  isLoading: false,
  error: null,
};

export const useAdminStore = create<AdminStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Authentication
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await adminApi.login(credentials);
          const data = extractData(response, 'Login failed');
          set({
            isAuthenticated: true,
            adminNickname: data.nickname,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            adminNickname: null,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          ...initialState,
        });
      },

      // Statistics
      fetchStatistics: async () => {
        set({ statisticsLoading: true, statisticsError: null });
        try {
          const statistics = extractData(await adminApi.getGameStatistics(), 'Failed to fetch statistics');
          set({
            statistics,
            statisticsLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch statistics';
          set({
            statisticsLoading: false,
            statisticsError: errorMessage,
          });
          throw error;
        }
      },

      // Games Management
      fetchActiveGames: async () => {
        set({ gamesLoading: true, gamesError: null });
        try {
          const games = extractData(await adminApi.getAllActiveGames(), 'Failed to fetch games');
          set({
            activeGames: games,
            gamesLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch games';
          set({
            gamesLoading: false,
            gamesError: errorMessage,
          });
          throw error;
        }
      },

      terminateGame: async (gameNumber) => {
        set({ isLoading: true, error: null });
        try {
          ensureSuccess(await adminApi.terminateRoom(gameNumber), 'Failed to terminate game');
          // Remove the terminated game from the list
          set((state) => ({
            activeGames: state.activeGames.filter(game => game.gameNumber !== gameNumber),
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to terminate game';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      kickPlayer: async (gameNumber, userId) => {
        set({ isLoading: true, error: null });
        try {
          ensureSuccess(await adminApi.kickPlayer(gameNumber, userId), 'Failed to kick player');
          set({ isLoading: false });
          // Optionally refresh games list
          get().fetchActiveGames();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to kick player';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Player Management
      fetchPlayers: async () => {
        set({ playersLoading: true, playersError: null });
        try {
          const players = extractData(await adminApi.getAllPlayers(), 'Failed to fetch players');
          set({
            players,
            playersLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch players';
          set({
            playersLoading: false,
            playersError: errorMessage,
          });
          throw error;
        }
      },

      grantAdminRole: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          ensureSuccess(await adminApi.grantAdminRole(userId), 'Failed to grant admin role');
          set({ isLoading: false });
          // Optionally refresh players list
          get().fetchPlayers();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to grant admin role';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Profanity Management
      fetchProfanityRequests: async () => {
        set({ profanityLoading: true, profanityError: null });
        try {
          const requests = extractData(await adminApi.getPendingProfanityRequests(), 'Failed to fetch profanity requests');
          set({
            profanityRequests: requests,
            profanityLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profanity requests';
          set({
            profanityLoading: false,
            profanityError: errorMessage,
          });
          throw error;
        }
      },

      approveProfanityRequest: async (requestId) => {
        set({ profanityLoading: true, profanityError: null });
        try {
          ensureSuccess(await adminApi.approveProfanityRequest(requestId), 'Failed to approve request');
          // Remove the approved request from the list
          set((state) => ({
            profanityRequests: state.profanityRequests.filter(req => req.id !== requestId),
            profanityLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to approve request';
          set({
            profanityLoading: false,
            profanityError: errorMessage,
          });
          throw error;
        }
      },

      rejectProfanityRequest: async (requestId) => {
        set({ profanityLoading: true, profanityError: null });
        try {
          ensureSuccess(await adminApi.rejectProfanityRequest(requestId), 'Failed to reject request');
          // Remove the rejected request from the list
          set((state) => ({
            profanityRequests: state.profanityRequests.filter(req => req.id !== requestId),
            profanityLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to reject request';
          set({
            profanityLoading: false,
            profanityError: errorMessage,
          });
          throw error;
        }
      },

      // Content Management
      fetchPendingContent: async () => {
        set({ contentLoading: true, contentError: null });
        try {
          const content = extractData(await adminApi.getPendingContents(), 'Failed to fetch pending content');
          set({
            pendingContent: content,
            contentLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pending content';
          set({
            contentLoading: false,
            contentError: errorMessage,
          });
          throw error;
        }
      },

      approveAllContent: async () => {
        set({ contentLoading: true, contentError: null });
        try {
          ensureSuccess(await adminApi.approveAllPendingContents(), 'Failed to approve all content');
          set({
            pendingContent: [],
            contentLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to approve all content';
          set({
            contentLoading: false,
            contentError: errorMessage,
          });
          throw error;
        }
      },

      // Cleanup Operations
      cleanupStaleGames: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = extractData(await adminApi.cleanupStaleGames(), 'Failed to cleanup stale games');
          set({ isLoading: false });
          // Refresh games list after cleanup
          get().fetchActiveGames();
          return { cleanedGames: result.cleanedGames, message: result.message };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup stale games';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      cleanupDisconnectedPlayers: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = extractData(await adminApi.cleanupDisconnectedPlayers(), 'Failed to cleanup disconnected players');
          set({ isLoading: false });
          // Refresh players list after cleanup
          get().fetchPlayers();
          return { cleanedPlayers: result.cleanedPlayers };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup disconnected players';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      cleanupEmptyGames: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = extractData(await adminApi.cleanupEmptyGames(), 'Failed to cleanup empty games');
          set({ isLoading: false });
          // Refresh games list after cleanup
          get().fetchActiveGames();
          return { cleanedGames: result.cleanedGames, message: result.message };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup empty games';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // UI Actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'admin-store',
    }
  )
);
