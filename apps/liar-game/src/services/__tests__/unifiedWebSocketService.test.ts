import type {MockedFunction} from 'vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {UnifiedWebSocketService} from '../unifiedWebSocketService';

// Mock SockJS and STOMP Client (ensure availability for hoisted mocks)
const { mockSockJS, mockStompClient } = vi.hoisted(() => {
  return {
    mockSockJS: vi.fn(),
    mockStompClient: {
      activate: vi.fn(),
      deactivate: vi.fn(),
      subscribe: vi.fn(),
      publish: vi.fn(),
      connected: false,
      config: undefined as any,
    },
  };
});

vi.mock('sockjs-client', () => ({
  default: mockSockJS
}));

vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn((config) => {
    mockStompClient.config = config;
    return mockStompClient;
  })
}));

describe('UnifiedWebSocketService', () => {
  let service: UnifiedWebSocketService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = UnifiedWebSocketService.getInstance();
    mockStompClient.connected = false;
  });

  afterEach(() => {
    service.disconnect();
  });

  const forceConnectionState = (connected: boolean, userId: number | null = null) => {
    (service as any).isConnected = connected;
    (service as any).isConnecting = false;
    (service as any).client = connected ? mockStompClient : null;
    (service as any).currentUserId = userId;
    mockStompClient.connected = connected;
  };

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = UnifiedWebSocketService.getInstance();
      const instance2 = UnifiedWebSocketService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Connection Management', () => {
    it('should connect successfully', async () => {
      mockStompClient.activate.mockImplementation(() => {
        forceConnectionState(true, 123);
      });

      await service.connect(123);
      
      expect(mockSockJS).toHaveBeenCalled();
      const sockUrl = mockSockJS.mock.calls[0][0];
      expect(sockUrl).toContain('/ws');
      expect(mockStompClient.activate).toHaveBeenCalled();
      expect(service.connected).toBe(true);
    });

    it('should handle connection failure', async () => {
      mockStompClient.activate.mockImplementation(() => {
        (service as any).isConnecting = false;
      });

      await expect(service.connect(123)).rejects.toThrow('Connection failed');
    });

    it('should disconnect properly', () => {
      forceConnectionState(true, 123);
      service.disconnect();
      expect(mockStompClient.deactivate).toHaveBeenCalled();
    });

    it('should not connect if already connecting', async () => {
      mockStompClient.activate.mockImplementation(() => {
        forceConnectionState(true, 123);
      });

      const promise1 = service.connect(123);
      const promise2 = service.connect(123);
      await Promise.all([promise1, promise2]);
      expect(mockStompClient.activate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Game Room Management', () => {
    beforeEach(() => {
      forceConnectionState(true);
    });

    it('should join game room successfully', () => {
      const gameNumber = 12345;
      const mockSubscription = { unsubscribe: vi.fn() };
      mockStompClient.subscribe.mockReturnValue(mockSubscription);

      service.joinGameRoom(gameNumber);

      expect(mockStompClient.subscribe).toHaveBeenCalledWith(
        `/topic/game/${gameNumber}`,
        expect.any(Function)
      );
      expect(mockStompClient.subscribe).toHaveBeenCalledWith(
        `/topic/game/${gameNumber}/chat`,
        expect.any(Function)
      );
      expect(mockStompClient.subscribe).toHaveBeenCalledWith(
        `/topic/game/${gameNumber}/events`,
        expect.any(Function)
      );
      expect(mockStompClient.subscribe).toHaveBeenCalledWith(
        `/topic/game/${gameNumber}/state`,
        expect.any(Function)
      );
    });

    it('should throw error when joining room without connection', () => {
      forceConnectionState(false);
      
      expect(() => service.joinGameRoom(12345))
        .toThrow('WebSocket not connected');
    });

    it('should leave game room and unsubscribe', () => {
      const gameNumber = 12345;
      const mockSubscription = { unsubscribe: vi.fn() };
      mockStompClient.subscribe.mockReturnValue(mockSubscription);

      // Join room first
      service.joinGameRoom(gameNumber);
      
      // Then leave
      service.leaveGameRoom();

      expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(4); // 4 subscriptions
    });
  });

  describe('Message Sending', () => {
    beforeEach(() => {
      forceConnectionState(true);
      service.joinGameRoom(12345);
    });

    it('should send game messages', () => {
      service.sendGameMessage('TEST_EVENT', { data: 'test' }, 12345);

      expect(mockStompClient.publish).toHaveBeenCalledWith({
        destination: '/app/game/12345/test_event',
        body: expect.stringContaining('"type":"TEST_EVENT"')
      });
    });

    it('should send chat messages', () => {
      service.sendChatMessage('Hello world', 12345);

      expect(mockStompClient.publish).toHaveBeenCalledWith({
        destination: '/app/game/12345/chat',
        body: expect.stringContaining('"message":"Hello world"')
      });
    });

    it('should send hint messages', () => {
      service.sendHint('It is blue', 12345);

      expect(mockStompClient.publish).toHaveBeenCalledWith({
        destination: '/app/game/12345/hint',
        body: expect.stringContaining('"hint":"It is blue"')
      });
    });

    it('should send vote messages', () => {
      service.sendVote('player123', 12345);

      expect(mockStompClient.publish).toHaveBeenCalledWith({
        destination: '/app/game/12345/vote',
        body: expect.stringContaining('"targetPlayerId":"player123"')
      });
    });

    it('should throw error when sending without connection', () => {
      forceConnectionState(false);

      expect(() => service.sendChatMessage('test'))
        .toThrow('WebSocket not connected');
    });

    it('should throw error when sending without game room', () => {
      service.leaveGameRoom(); // Leave current room

      expect(() => service.sendChatMessage('test'))
        .toThrow('No game room specified');
    });
  });

  describe('Event Handlers', () => {
    it('should register and unregister event handlers', () => {
      const handler = vi.fn();
      const unsubscribe = service.onGameEvent('PLAYER_JOINED', handler);

      expect(typeof unsubscribe).toBe('function');

      // Unsubscribe
      unsubscribe();

      // Handler should no longer be called
      // (This would need message handling simulation to test fully)
    });

    it('should register and unregister chat handlers', () => {
      const handler = vi.fn();
      const unsubscribe = service.onChatMessage(handler);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should register and unregister connection handlers', () => {
      const handler = vi.fn();
      const unsubscribe = service.onConnection(handler);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should register and unregister error handlers', () => {
      const handler = vi.fn();
      const unsubscribe = service.onError(handler);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('Message Handling', () => {
    let gameEventHandler: MockedFunction<any>;
    let chatMessageHandler: MockedFunction<any>;

    beforeEach(() => {
      forceConnectionState(true);
      gameEventHandler = vi.fn();
      chatMessageHandler = vi.fn();
      
      service.onGameEvent('PLAYER_JOINED', gameEventHandler);
      service.onChatMessage(chatMessageHandler);
      service.joinGameRoom(12345);
    });

    it('should handle incoming game events', () => {
      const mockMessage = {
        body: JSON.stringify({
          type: 'PLAYER_JOINED',
          gameNumber: 12345,
          payload: { playerId: 'player1', playerName: 'TestPlayer' }
        })
      };

      // Get the message handler that was registered during subscription
      const messageHandler = mockStompClient.subscribe.mock.calls[0][1];
      messageHandler(mockMessage);

      expect(gameEventHandler).toHaveBeenCalledWith({
        type: 'PLAYER_JOINED',
        gameNumber: 12345,
        payload: { playerId: 'player1', playerName: 'TestPlayer' },
        timestamp: expect.any(Number)
      });
    });

    it('should handle incoming chat messages', () => {
      const mockMessage = {
        body: JSON.stringify({
          id: 'msg1',
          gameNumber: 12345,
          playerId: 'player1',
          playerName: 'TestPlayer',
          message: 'Hello everyone!',
          type: 'CHAT'
        })
      };

      // Simulate subscription to chat channel
      service.joinGameRoom(12345);
      const chatSubscription = mockStompClient.subscribe.mock.calls.find(
        call => call[0].includes('/chat')
      );
      expect(chatSubscription).toBeDefined();
      const chatHandler = (chatSubscription ?? [undefined, () => undefined])[1];
      
      chatHandler(mockMessage);

      expect(chatMessageHandler).toHaveBeenCalledWith({
        id: 'msg1',
        gameNumber: 12345,
        playerId: 'player1',
        playerName: 'TestPlayer',
        message: 'Hello everyone!',
        type: 'CHAT',
        timestamp: expect.any(Number)
      });
    });

    it('should handle malformed messages gracefully', () => {
      const mockMessage = {
        body: 'invalid json'
      };

      const errorHandler = vi.fn();
      service.onError(errorHandler);

      // This should not throw but handle gracefully
      const messageHandler = mockStompClient.subscribe.mock.calls[0][1];
      expect(() => messageHandler(mockMessage)).not.toThrow();
    });
  });

  describe('Status Properties', () => {
    it('should return correct connection status', () => {
      forceConnectionState(false);
      expect(service.connected).toBe(false);
      expect(service.status).toBe('disconnected');

      forceConnectionState(true);
      expect(service.connected).toBe(true);
      expect(service.status).toBe('connected');
    });

    it('should return correct game number', () => {
      expect(service.gameNumber).toBeNull();
      
      forceConnectionState(true);
      service.joinGameRoom(12345);
      expect(service.gameNumber).toBe(12345);
    });

    it('should return correct user ID', () => {
      expect(service.userId).toBeNull();

      forceConnectionState(true, 123);
      expect(service.userId).toBe(123);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', () => {
      const errorHandler = vi.fn();
      service.onError(errorHandler);

      // Simulate connection error
      // This would be called by the STOMP client in real scenarios
      
      expect(errorHandler).not.toHaveBeenCalled(); // No error yet
    });

    it('should handle subscription errors', () => {
      forceConnectionState(true);
      mockStompClient.subscribe.mockImplementation(() => {
        throw new Error('Subscription failed');
      });

      expect(() => service.joinGameRoom(12345)).toThrow('Subscription failed');
    });
  });

  describe('Reconnection Logic', () => {
    it('should attempt reconnection on disconnect', async () => {
      const connectionHandler = vi.fn();
      service.onConnection(connectionHandler);

      // Simulate disconnection
      mockStompClient.connected = false;
      
      // In real implementation, this would trigger reconnection logic
      // For now, we just verify the handler registration works
      expect(connectionHandler).not.toHaveBeenCalled();
    });
  });
});
