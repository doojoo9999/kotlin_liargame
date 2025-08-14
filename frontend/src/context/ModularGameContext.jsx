/**
 * Modular Game Context
 * Demonstrates the refactored GameContext using all the separated modules
 * This serves as a thin wrapper that orchestrates the various specialized modules
 */

import React, {createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef} from 'react';

// Import all the modular utilities
import cacheManager from '../utils/cacheManager.js';
import stateSyncManager from '../utils/stateSyncManager.js';
import asyncTaskQueue from '../utils/asyncTaskQueue.js';
import stateValidators from '../utils/stateValidators.js';
import eventBus from '../utils/eventBus.js';
import logger from '../utils/debugLogger.js';
import {createUserDataFromLogin, normalizeRoomsList} from '../utils/dataTransformers.js';
import {createChatEventHandlers} from '../utils/eventHandlers/chatEventHandlers.js';
import {createGameEventHandlers} from '../utils/eventHandlers/gameEventHandlers.js';
import {createPlayerEventHandlers} from '../utils/eventHandlers/playerEventHandlers.js';
import {createRoomEventHandlers} from '../utils/eventHandlers/roomEventHandlers.js';

// Original imports (will be abstracted through adapters)
import * as gameApi from '../api/gameApi';
import gameStompClient from '../socket/gameStompClient';

// Create the context
const ModularGameContext = createContext();

// Simplified initial state (much smaller now)
const initialState = {
  // Core state only - most complexity moved to modules
  currentUser: null,
  isAuthenticated: false,
  currentRoom: null,
  roomList: [],
  subjects: [],
  socketConnected: false,
  chatMessages: [],
  roomPlayers: [],
  
  // Game state
  gameStatus: 'WAITING',
  currentRound: 0,
  playerRole: null,
  assignedWord: null,
  gameTimer: 0,
  
  // UI state
  loading: {
    rooms: false,
    room: false,
    auth: false,
    subjects: false,
    socket: false,
    chatHistory: false
  },
  error: {
    rooms: null,
    room: null,
    auth: null,
    subjects: null,
    socket: null
  },
  
  currentPage: 'lobby'
};

// Action types (simplified)
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  SET_ROOM_LIST: 'SET_ROOM_LIST',
  SET_CURRENT_ROOM: 'SET_CURRENT_ROOM',
  CLEAR_CURRENT_ROOM: 'CLEAR_CURRENT_ROOM',
  UPDATE_ROOM_IN_LIST: 'UPDATE_ROOM_IN_LIST',
  SET_SUBJECTS: 'SET_SUBJECTS',
  ADD_SUBJECT: 'ADD_SUBJECT',
  SET_SOCKET_CONNECTION: 'SET_SOCKET_CONNECTION',
  ADD_CHAT_MESSAGE: 'ADD_CHAT_MESSAGE',
  SET_CHAT_MESSAGES: 'SET_CHAT_MESSAGES',
  CLEAR_CHAT_MESSAGES: 'CLEAR_CHAT_MESSAGES',
  SET_ROOM_PLAYERS: 'SET_ROOM_PLAYERS',
  UPDATE_PLAYER_IN_ROOM: 'UPDATE_PLAYER_IN_ROOM',
  SET_CURRENT_TURN_PLAYER: 'SET_CURRENT_TURN_PLAYER',
  SET_GAME_STATUS: 'SET_GAME_STATUS',
  SET_CURRENT_ROUND: 'SET_CURRENT_ROUND',
  SET_PLAYER_ROLE: 'SET_PLAYER_ROLE',
  SET_ASSIGNED_WORD: 'SET_ASSIGNED_WORD',
  SET_GAME_TIMER: 'SET_GAME_TIMER',
  RESET_GAME_STATE: 'RESET_GAME_STATE',
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE'
};

// Simplified reducer (complex logic moved to modules)
const gameReducer = (state, action) => {
  logger.debug('Action dispatched', { type: action.type, payload: action.payload }, 'ModularGameContext');
  
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.type]: action.payload.value
        }
      };
      
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: {
          ...state.error,
          [action.payload.type]: action.payload.value
        }
      };
      
    case ActionTypes.SET_USER:
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: !!action.payload
      };
      
    case ActionTypes.LOGOUT:
      localStorage.removeItem('userData');
      return {
        ...state,
        currentUser: null,
        isAuthenticated: false,
        currentRoom: null,
        currentPage: 'lobby'
      };
      
    case ActionTypes.SET_ROOM_LIST:
      return {
        ...state,
        roomList: action.payload
      };
      
    case ActionTypes.SET_CURRENT_ROOM:
      return {
        ...state,
        currentRoom: action.payload,
        currentPage: 'room'
      };
      
    case ActionTypes.CLEAR_CURRENT_ROOM:
      return {
        ...state,
        currentRoom: null,
        currentPage: 'lobby'
      };
      
    case ActionTypes.UPDATE_ROOM_IN_LIST:
      return {
        ...state,
        roomList: state.roomList.map(room =>
          room.gameNumber === action.payload.gameNumber
            ? { ...room, ...action.payload }
            : room
        )
      };
      
    case ActionTypes.SET_SUBJECTS:
      return {
        ...state,
        subjects: action.payload
      };

    case ActionTypes.ADD_SUBJECT:
      // Use validator to check for duplicates
      const validation = stateValidators.validateSubjectData(action.payload);
      if (!validation.valid) {
        logger.warn('Invalid subject data', validation, 'ModularGameContext');
        return state;
      }
      
      const subjectExists = state.subjects.some(subject => subject.id === action.payload.id);
      if (subjectExists) {
        logger.debug('Subject already exists in state, not adding duplicate', action.payload, 'ModularGameContext');
        return state;
      }
      
      return {
        ...state,
        subjects: [...state.subjects, validation.correctedValue || action.payload]
      };
      
    case ActionTypes.SET_SOCKET_CONNECTION:
      return {
        ...state,
        socketConnected: action.payload
      };
      
    case ActionTypes.ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      };
      
    case ActionTypes.SET_CHAT_MESSAGES:
      return {
        ...state,
        chatMessages: action.payload
      };
      
    case ActionTypes.CLEAR_CHAT_MESSAGES:
      return {
        ...state,
        chatMessages: []
      };
      
    case ActionTypes.SET_ROOM_PLAYERS:
      return {
        ...state,
        roomPlayers: action.payload
      };
      
    case ActionTypes.UPDATE_PLAYER_IN_ROOM:
      return {
        ...state,
        roomPlayers: state.roomPlayers.map(player =>
          player.id === action.payload.id
            ? { ...player, ...action.payload }
            : player
        )
      };
      
    case ActionTypes.SET_CURRENT_TURN_PLAYER:
      return {
        ...state,
        currentTurnPlayerId: action.payload
      };
      
    case ActionTypes.SET_GAME_STATUS:
      return {
        ...state,
        gameStatus: action.payload
      };
      
    case ActionTypes.SET_CURRENT_ROUND:
      return {
        ...state,
        currentRound: action.payload
      };
      
    case ActionTypes.SET_PLAYER_ROLE:
      return {
        ...state,
        playerRole: action.payload
      };
      
    case ActionTypes.SET_ASSIGNED_WORD:
      return {
        ...state,
        assignedWord: action.payload
      };
      
    case ActionTypes.SET_GAME_TIMER:
      return {
        ...state,
        gameTimer: action.payload
      };
      
    case ActionTypes.RESET_GAME_STATE:
      return {
        ...state,
        gameStatus: 'WAITING',
        currentRound: 0,
        playerRole: null,
        assignedWord: null,
        gameTimer: 0
      };
      
    case ActionTypes.SET_CURRENT_PAGE:
      return {
        ...state,
        currentPage: action.payload
      };
      
    default:
      logger.warn('Unknown action type', { type: action.type }, 'ModularGameContext');
      return state;
  }
};

// Context provider component
const ModularGameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const socketRef = useRef(null);
  const eventHandlersRef = useRef(null);
  
  // Get named logger for this component
  const contextLogger = logger.getLogger('ModularGameContext');
  
  // Initialize event handlers
  useEffect(() => {
    contextLogger.info('Initializing modular game context');
    
    // Create event handlers with dispatch
    eventHandlersRef.current = {
      chat: createChatEventHandlers(dispatch),
      game: createGameEventHandlers(dispatch),
      player: createPlayerEventHandlers(dispatch),
      room: createRoomEventHandlers(dispatch)
    };
    
    // Set up event bus listeners
    const eventListeners = [
      eventBus.on('game:state:changed', (event) => {
        contextLogger.debug('Game state changed via event bus', event.data);
        stateSyncManager.updateServerState(event.data);
      }),
      
      eventBus.on('cache:invalidated', (event) => {
        contextLogger.debug('Cache invalidated', event.data);
        // Refresh data if needed
      }),
      
      eventBus.on('error:global', (event) => {
        contextLogger.error('Global error caught by event bus', event.data);
        setError('general', event.data.message);
      })
    ];
    
    // Cleanup function
    return () => {
      contextLogger.info('Cleaning up modular game context');
      eventListeners.forEach(listenerId => eventBus.off(listenerId));
      
      // Clean up modules
      stateSyncManager.cleanup();
      asyncTaskQueue.cancelAllPending();
      cacheManager.clearAll();
    };
  }, []);

  // Sync state with state sync manager
  useEffect(() => {
    stateSyncManager.setLocalState(state);
  }, [state]);

  // Helper functions using modules
  const setLoading = useCallback((type, value) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { type, value } });
    eventBus.emit('loading:changed', { type, value }, 'ModularGameContext');
  }, []);

  const setError = useCallback((type, value) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: { type, value } });
    eventBus.emit('error:changed', { type, value }, 'ModularGameContext');
    if (value) {
      contextLogger.error(`Error in ${type}`, value);
    }
  }, []);

  // Auth functions using modules
  const login = useCallback(async (nickname) => {
    const taskId = asyncTaskQueue.addUrgentTask(
      'auth_login',
      async (signal, updateProgress) => {
        try {
          setLoading('auth', true);
          setError('auth', null);
          updateProgress(10);

          // Check cache first
          const cachedUser = cacheManager.getCachedUserData();
          if (cachedUser && cachedUser.nickname === nickname) {
            contextLogger.info('Using cached user data for login');
            updateProgress(100);
            return cachedUser;
          }

          updateProgress(30);
          const result = await gameApi.login(nickname);
          updateProgress(70);
          
          const userData = createUserDataFromLogin(result, nickname);
          
          // Validate user data
          const validation = stateValidators.validate('user', userData);
          if (!validation.valid) {
            throw new Error(`Invalid user data: ${validation.message}`);
          }

          updateProgress(90);
          
          // Cache and store user data
          cacheManager.cacheUserData(userData);
          localStorage.setItem('userData', JSON.stringify(userData));
          
          dispatch({ type: ActionTypes.SET_USER, payload: userData });
          eventBus.emit('user:login', userData, 'ModularGameContext');
          
          updateProgress(100);
          return userData;

        } catch (error) {
          contextLogger.error('Login failed', error);
          setError('auth', '로그인에 실패했습니다.');
          throw error;
        } finally {
          setLoading('auth', false);
        }
      },
      {
        maxRetries: 2,
        timeout: 10000
      }
    );

    return asyncTaskQueue.getTask(taskId)?.result;
  }, []);

  const logout = useCallback(() => {
    try {
      contextLogger.info('User logging out');
      
      // Disconnect WebSocket
      if (gameStompClient.isClientConnected()) {
        gameStompClient.disconnect();
      }

      socketRef.current = null;

      // Clear cache and storage
      cacheManager.clearAll();
      localStorage.removeItem('userData');

      // Dispatch logout actions
      dispatch({ type: ActionTypes.LOGOUT });
      dispatch({ type: ActionTypes.CLEAR_CURRENT_ROOM });
      dispatch({ type: ActionTypes.CLEAR_CHAT_MESSAGES });
      dispatch({ type: ActionTypes.RESET_GAME_STATE });
      
      // Emit logout event
      eventBus.emit('user:logout', null, 'ModularGameContext');
      
    } catch (error) {
      contextLogger.error('Logout error', error);
    }
  }, []);

  // Room functions using modules
  const fetchRooms = useCallback(async () => {
    const taskId = asyncTaskQueue.addTask(
      'fetch_rooms',
      async (signal, updateProgress) => {
        try {
          setLoading('rooms', true);
          setError('rooms', null);
          updateProgress(10);

          // Check cache first
          const cachedRooms = cacheManager.getCachedRooms();
          if (cachedRooms) {
            contextLogger.info('Using cached rooms data');
            dispatch({ type: ActionTypes.SET_ROOM_LIST, payload: cachedRooms });
            updateProgress(100);
            return cachedRooms;
          }

          updateProgress(30);
          const rooms = await gameApi.getAllRooms();
          updateProgress(70);

          if (!Array.isArray(rooms)) {
            throw new Error('API response is not array');
          }

          const normalizedRooms = normalizeRoomsList(rooms);
          
          // Validate rooms data
          for (const room of normalizedRooms) {
            const validation = stateValidators.validateRoomData(room);
            if (!validation.valid) {
              contextLogger.warn('Invalid room data detected', { room, validation });
            }
          }

          updateProgress(90);
          
          // Cache and dispatch
          cacheManager.cacheRooms(normalizedRooms);
          dispatch({ type: ActionTypes.SET_ROOM_LIST, payload: normalizedRooms });
          eventBus.emit('rooms:updated', normalizedRooms, 'ModularGameContext');
          
          updateProgress(100);
          return normalizedRooms;

        } catch (error) {
          contextLogger.error('Failed to fetch rooms', error);
          setError('rooms', '방 목록을 불러오는데 실패했습니다.');
          dispatch({ type: ActionTypes.SET_ROOM_LIST, payload: [] });
          throw error;
        } finally {
          setLoading('rooms', false);
        }
      },
      {
        maxRetries: 2,
        priority: 2 // High priority
      }
    );

    return asyncTaskQueue.getTask(taskId)?.result;
  }, []);

  // Optimistic room creation using state sync manager
  const createRoom = useCallback(async (roomData) => {
    try {
      const optimisticRoom = {
        gameNumber: Date.now(), // Temporary ID
        title: roomData.gameName,
        host: state.currentUser?.nickname,
        currentPlayers: 1,
        maxPlayers: roomData.gameParticipants,
        state: 'WAITING',
        players: [state.currentUser]
      };

      // Use optimistic update from state sync manager
      return await stateSyncManager.optimisticUpdate(
        'CREATE_ROOM',
        {
          currentRoom: optimisticRoom,
          roomList: [...state.roomList, optimisticRoom]
        },
        async () => {
          // Actual server sync
          const result = await gameApi.createRoom(roomData);
          
          // Update with real room data
          const realRoom = {
            ...optimisticRoom,
            gameNumber: result.gameNumber || result
          };
          
          cacheManager.cacheRoom(realRoom.gameNumber, realRoom);
          eventBus.emit('room:created', realRoom, 'ModularGameContext');
          
          return realRoom;
        }
      );
      
    } catch (error) {
      contextLogger.error('Room creation failed', error);
      setError('room', '방 생성에 실패했습니다.');
      throw error;
    }
  }, [state.currentUser, state.roomList]);

  // Context value with all functions and state
  const contextValue = useMemo(() => ({
    // State
    ...state,
    
    // Actions
    login,
    logout,
    fetchRooms,
    createRoom,
    setLoading,
    setError,
    
    // Module access for advanced usage
    modules: {
      cache: cacheManager,
      stateSync: stateSyncManager,
      taskQueue: asyncTaskQueue,
      validators: stateValidators,
      eventBus: eventBus,
      logger: contextLogger
    },
    
    // Event handlers
    eventHandlers: eventHandlersRef.current,
    
    // Utility functions
    dispatch // For direct state updates when needed
  }), [state, login, logout, fetchRooms, createRoom, setLoading, setError]);

  return (
    <ModularGameContext.Provider value={contextValue}>
      {children}
    </ModularGameContext.Provider>
  );
};

// Custom hook to use the context
const useModularGame = () => {
  const context = useContext(ModularGameContext);
  if (context === undefined) {
    throw new Error('useModularGame must be used within a ModularGameProvider');
  }
  return context;
};

// Export everything
export { ModularGameContext, ModularGameProvider, useModularGame };
export default ModularGameContext;