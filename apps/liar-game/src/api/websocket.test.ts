import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {ChatMessage, GameStateUpdate, WebSocketMessage} from './websocket';
import {GameWebSocketClient} from './websocket';
import {MockWebSocket} from '@/test/mocks/handlers';

// Mock WebSocket globally
global.WebSocket = MockWebSocket as any;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('GameWebSocketClient', () => {
  let client: GameWebSocketClient;
  let mockWs: MockWebSocket;
  
  // Store original WebSocket constructor to restore later
  const originalWebSocket = global.WebSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    
    // Create a new mock WebSocket class for each test
    const MockWebSocketConstructor = vi.fn().mockImplementation((url: string) => {
      mockWs = new MockWebSocket(url);
      return mockWs;
    });
    
    // Add required static properties
    Object.assign(MockWebSocketConstructor, {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
      prototype: MockWebSocket.prototype
    });
    
    global.WebSocket = MockWebSocketConstructor as any;
    
    client = new GameWebSocketClient({
      url: 'ws://218.150.3.77:8080/ws',
      reconnectAttempts: 3,
      reconnectDelay: 100,
      heartbeatInterval: 1000,
      connectionTimeout: 1000,
    });
  });

  afterEach(() => {
    client?.disconnect();
    vi.clearAllTimers();
    global.WebSocket = originalWebSocket;
  });

  describe('Connection Management', () => {
    it('should connect successfully', async () => {
      const connectPromise = client.connect(1, 'test-player');
      
      // Simulate successful connection immediately
      mockWs.mockConnect();

      await expect(connectPromise).resolves.toBeUndefined();
      expect(client.isConnected()).toBe(true);
      expect(client.getConnectionState()).toBe('connected');
    });

    it('should handle connection timeout', async () => {
      const connectPromise = client.connect(1, 'test-player');
      
      // Don't trigger onopen to simulate timeout
      await expect(connectPromise).rejects.toThrow('Connection timeout');
      expect(client.getConnectionState()).toBe('error');
    });

    it('should include game parameters in WebSocket URL', async () => {
      mockLocalStorage.getItem.mockReturnValue('auth-token-123');
      
      const connectPromise = client.connect(42, 'player-123');
      
      setTimeout(() => {
        mockWs = (WebSocket as any).mock.results[0].value;
        mockWs.onopen?.(new Event('open'));
      }, 50);

      await connectPromise;

      // Check that WebSocket was called with correct URL
      const wsCall = (WebSocket as any).mock.calls[0];
      const url = wsCall[0];
      expect(url).toContain('gameNumber=42');
      expect(url).toContain('playerId=player-123');
      expect(url).toContain('token=auth-token-123');
    });

    it('should disconnect gracefully', async () => {
      await client.connect(1, 'test-player');
      
      const disconnectHandler = vi.fn();
      client.on('DISCONNECT', disconnectHandler);

      client.disconnect();

      expect(client.isConnected()).toBe(false);
      expect(client.getConnectionState()).toBe('disconnected');
      expect(disconnectHandler).toHaveBeenCalledWith({
        code: 1000,
        reason: 'Client disconnect'
      });
    });
  });

  describe('Event System', () => {
    beforeEach(async () => {
      const connectPromise = client.connect(1, 'test-player');
      
      setTimeout(() => {
        mockWs = (WebSocket as any).mock.results[0].value;
        mockWs.readyState = WebSocket.OPEN;
        mockWs.onopen?.(new Event('open'));
      }, 50);

      await connectPromise;
    });

    it('should register and unregister event handlers', () => {
      const handler = vi.fn();
      const unsubscribe = client.on('CHAT_MESSAGE', handler);

      // Simulate receiving a message
      const message: WebSocketMessage<ChatMessage> = {
        type: 'CHAT_MESSAGE',
        timestamp: '2024-01-01T00:00:00Z',
        data: {
          id: 'msg-1',
          gameNumber: 1,
          playerId: 'player-1',
          playerName: 'TestPlayer',
          gameId: '1',
          message: 'Hello world',
          type: 'DISCUSSION',
          timestamp: Date.now()
        }
      };

      mockWs.onmessage?.(new MessageEvent('message', {
        data: JSON.stringify(message)
      }));

      expect(handler).toHaveBeenCalledWith(message.data);

      // Unsubscribe and test handler is not called
      unsubscribe();
      handler.mockClear();

      mockWs.onmessage?.(new MessageEvent('message', {
        data: JSON.stringify(message)
      }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      client.on('GAME_STATE_UPDATE', handler1);
      client.on('GAME_STATE_UPDATE', handler2);

      const message: WebSocketMessage<GameStateUpdate> = {
        type: 'GAME_STATE_UPDATE',
        timestamp: '2024-01-01T00:00:00Z',
        data: {
          gameNumber: 1,
          gameState: 'IN_PROGRESS',
          currentPhase: 'SPEECH',
          players: []
        }
      };

      mockWs.onmessage?.(new MessageEvent('message', {
        data: JSON.stringify(message)
      }));

      expect(handler1).toHaveBeenCalledWith(message.data);
      expect(handler2).toHaveBeenCalledWith(message.data);
    });

    it('should handle malformed messages gracefully', () => {
      const errorHandler = vi.fn();
      client.on('ERROR', errorHandler);

      // Send malformed JSON
      mockWs.onmessage?.(new MessageEvent('message', {
        data: 'invalid json'
      }));

      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
        phase: 'message_parse',
        rawData: 'invalid json'
      }));
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      const connectPromise = client.connect(1, 'test-player');
      
      setTimeout(() => {
        mockWs = (WebSocket as any).mock.results[0].value;
        mockWs.readyState = WebSocket.OPEN;
        mockWs.onopen?.(new Event('open'));
      }, 50);

      await connectPromise;
    });

    it('should send messages successfully', () => {
      const result = client.send('CHAT_MESSAGE', {
        content: 'Hello',
        type: 'DISCUSSION'
      });

      expect(result).toBe(true);
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"CHAT_MESSAGE"')
      );
    });

    it('should fail to send when not connected', () => {
      client.disconnect();

      const result = client.send('CHAT_MESSAGE', { content: 'Hello' });

      expect(result).toBe(false);
    });

    it('should include game context in messages', () => {
      client.send('PLAYER_READY', { ready: true });

      const sentMessage = mockWs.send.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);

      expect(parsedMessage.gameNumber).toBe(1);
      expect(parsedMessage.playerId).toBe('test-player');
      expect(parsedMessage.timestamp).toBeTruthy();
    });
  });

  describe('Convenience Methods', () => {
    beforeEach(async () => {
      const connectPromise = client.connect(1, 'test-player');
      
      setTimeout(() => {
        mockWs = (WebSocket as any).mock.results[0].value;
        mockWs.readyState = WebSocket.OPEN;
        mockWs.onopen?.(new Event('open'));
      }, 50);

      await connectPromise;
    });

    it('should join room correctly', () => {
      const result = client.joinRoom(123, 'player-456');

      expect(result).toBe(true);
      
      const sentMessage = mockWs.send.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);
      
      expect(parsedMessage.type).toBe('PLAYER_JOINED');
      expect(parsedMessage.data.gameNumber).toBe(123);
      expect(parsedMessage.data.playerId).toBe('player-456');
    });

    it('should leave room correctly', () => {
      const result = client.leaveRoom();

      expect(result).toBe(true);
      
      const sentMessage = mockWs.send.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);
      
      expect(parsedMessage.type).toBe('PLAYER_LEFT');
    });

    it('should set ready status correctly', () => {
      client.setReady(true);
      
      let sentMessage = mockWs.send.mock.calls[0][0];
      let parsedMessage = JSON.parse(sentMessage);
      expect(parsedMessage.type).toBe('PLAYER_READY');

      client.setReady(false);
      
      sentMessage = mockWs.send.mock.calls[1][0];
      parsedMessage = JSON.parse(sentMessage);
      expect(parsedMessage.type).toBe('PLAYER_UNREADY');
    });

    it('should send chat messages correctly', () => {
      client.sendChat('Hello world', 'DISCUSSION');

      const sentMessage = mockWs.send.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);
      
      expect(parsedMessage.type).toBe('CHAT_MESSAGE');
      expect(parsedMessage.data.content).toBe('Hello world');
      expect(parsedMessage.data.type).toBe('DISCUSSION');
    });

    it('should cast votes correctly', () => {
      client.castVote('target-player-id');

      const sentMessage = mockWs.send.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);
      
      expect(parsedMessage.type).toBe('PLAYER_VOTED');
      expect(parsedMessage.data.targetPlayerId).toBe('target-player-id');
    });

    it('should handle typing indicators', () => {
      client.startTyping();
      
      let sentMessage = mockWs.send.mock.calls[0][0];
      let parsedMessage = JSON.parse(sentMessage);
      expect(parsedMessage.type).toBe('TYPING_START');

      client.stopTyping();
      
      sentMessage = mockWs.send.mock.calls[1][0];
      parsedMessage = JSON.parse(sentMessage);
      expect(parsedMessage.type).toBe('TYPING_STOP');
    });
  });

  describe('Reconnection Logic', () => {
    it('should attempt reconnection on unexpected disconnect', async () => {
      const connectPromise = client.connect(1, 'test-player');
      
      setTimeout(() => {
        mockWs = (WebSocket as any).mock.results[0].value;
        mockWs.readyState = WebSocket.OPEN;
        mockWs.onopen?.(new Event('open'));
      }, 50);

      await connectPromise;

      const reconnectHandler = vi.fn();
      client.on('RECONNECT', reconnectHandler);

      // Simulate unexpected disconnect
      mockWs.onclose?.(new CloseEvent('close', { code: 1006 }));

      expect(client.getConnectionState()).toBe('reconnecting');
      expect(reconnectHandler).toHaveBeenCalledWith({
        attempt: 1,
        maxAttempts: 3,
        delay: expect.any(Number)
      });
    });

    it('should not reconnect on normal disconnect', async () => {
      const connectPromise = client.connect(1, 'test-player');
      
      setTimeout(() => {
        mockWs = (WebSocket as any).mock.results[0].value;
        mockWs.readyState = WebSocket.OPEN;
        mockWs.onopen?.(new Event('open'));
      }, 50);

      await connectPromise;

      const reconnectHandler = vi.fn();
      client.on('RECONNECT', reconnectHandler);

      // Simulate normal disconnect
      mockWs.onclose?.(new CloseEvent('close', { code: 1000 }));

      expect(reconnectHandler).not.toHaveBeenCalled();
    });

    it('should give up after max reconnection attempts', async () => {
      const connectPromise = client.connect(1, 'test-player');
      
      setTimeout(() => {
        mockWs = (WebSocket as any).mock.results[0].value;
        mockWs.readyState = WebSocket.OPEN;
        mockWs.onopen?.(new Event('open'));
      }, 50);

      await connectPromise;

      const errorHandler = vi.fn();
      client.on('ERROR', errorHandler);

      // Simulate multiple failed reconnections
      for (let i = 0; i < 4; i++) {
        mockWs.onclose?.(new CloseEvent('close', { code: 1006 }));
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      expect(errorHandler).toHaveBeenCalledWith({
        error: 'Max reconnection attempts reached'
      });
      expect(client.getConnectionState()).toBe('error');
    });
  });

  describe('Heartbeat Management', () => {
    beforeEach(async () => {
      const connectPromise = client.connect(1, 'test-player');
      
      setTimeout(() => {
        mockWs = (WebSocket as any).mock.results[0].value;
        mockWs.readyState = WebSocket.OPEN;
        mockWs.onopen?.(new Event('open'));
      }, 50);

      await connectPromise;
    });

    it('should send heartbeat messages', async () => {
      vi.useFakeTimers();
      
      // Fast-forward time to trigger heartbeat
      vi.advanceTimersByTime(1000);

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"HEARTBEAT"')
      );

      vi.useRealTimers();
    });

    it('should handle heartbeat responses', () => {
      const heartbeatMessage: WebSocketMessage = {
        type: 'HEARTBEAT',
        timestamp: '2024-01-01T00:00:00Z',
        data: { timestamp: Date.now() }
      };

      // Should not emit HEARTBEAT events to user handlers
      const heartbeatHandler = vi.fn();
      client.on('HEARTBEAT', heartbeatHandler);

      mockWs.onmessage?.(new MessageEvent('message', {
        data: JSON.stringify(heartbeatMessage)
      }));

      expect(heartbeatHandler).not.toHaveBeenCalled();
    });
  });

  describe('Connection State Management', () => {
    it('should track connection states correctly', () => {
      expect(client.getConnectionState()).toBe('disconnected');
      expect(client.isConnected()).toBe(false);
      expect(client.getReconnectAttempts()).toBe(0);
    });

    it('should update game context', () => {
      client.updateGameContext(999, 'new-player');

      client.connect();
      
      // Should use updated context in connection URL
      const wsCall = (WebSocket as any).mock.calls[0];
      const url = wsCall[0];
      expect(url).toContain('gameNumber=999');
      expect(url).toContain('playerId=new-player');
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket creation errors', async () => {
      // Mock WebSocket constructor to throw error
      const originalWebSocket = global.WebSocket;
      const ErrorWebSocketConstructor = vi.fn().mockImplementation(() => {
        throw new Error('WebSocket creation failed');
      });
      
      // Add required static properties
      Object.assign(ErrorWebSocketConstructor, {
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3,
        prototype: MockWebSocket.prototype
      });
      
      global.WebSocket = ErrorWebSocketConstructor as any;

      const errorHandler = vi.fn();
      client.on('ERROR', errorHandler);

      await expect(client.connect(1, 'test-player')).rejects.toThrow('WebSocket creation failed');
      
      expect(errorHandler).toHaveBeenCalledWith({
        error: expect.any(Error),
        phase: 'setup'
      });

      global.WebSocket = originalWebSocket;
    });

    it('should handle message sending errors', async () => {
      const connectPromise = client.connect(1, 'test-player');
      
      setTimeout(() => {
        mockWs = (WebSocket as any).mock.results[0].value;
        mockWs.readyState = WebSocket.OPEN;
        mockWs.send = vi.fn().mockImplementation(() => {
          throw new Error('Send failed');
        });
        mockWs.onopen?.(new Event('open'));
      }, 50);

      await connectPromise;

      const errorHandler = vi.fn();
      client.on('ERROR', errorHandler);

      const result = client.send('CHAT_MESSAGE', { content: 'test' });

      expect(result).toBe(false);
      expect(errorHandler).toHaveBeenCalledWith({
        error: expect.any(Error),
        phase: 'message_send',
        message: expect.any(Object)
      });
    });
  });
});



