import {create} from 'zustand';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {useGameStore} from './gameStore';
import {useRoomStore} from './roomStore';

export const useSocketStore = create((set, get) => ({
  stompClient: null,
  isConnected: false,
  isConnecting: false,
  subscriptions: new Map(),

  connect: (serverUrl = 'http://localhost:20021') => {
    return new Promise((resolve, reject) => {
      if (get().isConnected || get().isConnecting) {
        console.log('[SocketStore] Already connected or connecting.');
        return resolve(get().stompClient);
      }

      set({ isConnecting: true });

      const socket = new SockJS(`${serverUrl}/ws`);
      const client = new Client({
        webSocketFactory: () => socket,
        debug: (str) => { console.log('[SocketStore Debug]', str); },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = (frame) => {
        console.log('[SocketStore] Connected:', frame);
        set({ stompClient: client, isConnected: true, isConnecting: false });
        get().resubscribeAll();
        resolve(client);
      };

      client.onStompError = (frame) => {
        console.error('[SocketStore] STOMP error:', frame);
        set({ isConnected: false, isConnecting: false });
        reject(new Error(`STOMP error: ${frame.headers['message']}`));
      };

      client.onWebSocketClose = () => {
        console.log('[SocketStore] WebSocket closed.');
        set({ isConnected: false, isConnecting: false });
      };

      client.activate();
    });
  },

  disconnect: () => {
    const { stompClient, subscriptions } = get();
    if (stompClient) {
      console.log('[SocketStore] Disconnecting...');
      subscriptions.forEach(sub => sub.unsubscribe());
      stompClient.deactivate();
    }
    set({ stompClient: null, isConnected: false, subscriptions: new Map() });
  },

  subscribe: (topic, callback) => {
    const { stompClient, isConnected, subscriptions } = get();
    if (!isConnected || !stompClient) {
      console.error('[SocketStore] Cannot subscribe, not connected.');
      return;
    }
    if (subscriptions.has(topic)) {
      console.log('[SocketStore] Already subscribed to:', topic);
      return;
    }

    const subscription = stompClient.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('[SocketStore] Failed to parse message:', error, message.body);
      }
    });

    set((state) => ({ subscriptions: new Map(state.subscriptions).set(topic, { subscription, callback }) }));
  },

  resubscribeAll: () => {
    const { subscriptions, stompClient } = get();
    if (!stompClient || !stompClient.connected) return;
    subscriptions.forEach((value, topic) => {
        const newSub = stompClient.subscribe(topic, (message) => {
            try {
                const data = JSON.parse(message.body);
                value.callback(data);
            } catch (error) {
                console.error('[SocketStore] Failed to parse message on resubscribe:', error, message.body);
            }
        });
        // It might be good to update the subscription object in the map, but skipping for simplicity now.
    });
  },

  publish: (destination, body = {}) => {
    const { stompClient, isConnected } = get();
    if (isConnected && stompClient) {
      stompClient.publish({ destination, body: JSON.stringify(body) });
    } else {
      console.error('[SocketStore] Cannot publish, not connected.');
    }
  },

  // --- Domain-specific subscriptions ---
  initializeSubscriptions: (gameNumber) => {
    const { subscribe } = get();
    const { setRoomList, updateRoomInList, setCurrentRoom } = useRoomStore.getState();
    const { 
        setGameStatus, setRoomPlayers, addChatMessage, setModeratorMessage, 
        setCurrentTurnPlayerId, setPlayerRole, setAssignedWord, setGameResults, 
        setAccusedPlayerId, setGameTimer, setCurrentRound 
    } = useGameStore.getState();

    // Room-level updates (lobby and general room state)
    subscribe(`/topic/rooms`, (data) => {
        setRoomList(data);
    });

    subscribe(`/topic/room.${gameNumber}`, (update) => {
      console.log('[Socket] Room Update:', update);
      updateRoomInList(update); // Update in lobby list
      setCurrentRoom(update); // Update current room details
      if(update.players) {
        setRoomPlayers(update.players);
      }
      if(update.gameState) {
        setGameStatus(update.gameState);
      }
    });

    // Game-specific updates
    subscribe(`/topic/game.${gameNumber}.state`, (state) => {
        console.log('[Socket] Game State Update:', state);
        setGameStatus(state.gameStatus);
        setCurrentRound(state.currentRound);
        setGameTimer(state.timer);
        setRoomPlayers(state.players);
        setCurrentTurnPlayerId(state.currentTurnPlayerId);
        setAccusedPlayerId(state.accusedPlayerId);
        setGameResults(state.gameResults);
    });

    subscribe(`/topic/game.${gameNumber}.chat`, (message) => {
        addChatMessage(message);
    });

    subscribe(`/topic/game.${gameNumber}.moderator`, (message) => {
        setModeratorMessage(message.content);
        setTimeout(() => setModeratorMessage(null), 4000);
    });

    // Player-specific updates
    subscribe(`/user/queue/game.${gameNumber}.role`, (data) => {
        console.log('[Socket] Role/Word Update:', data);
        setPlayerRole(data.role);
        setAssignedWord(data.word);
    });
  },
}));
