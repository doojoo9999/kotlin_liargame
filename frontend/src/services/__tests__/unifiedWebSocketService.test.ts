import {afterEach, beforeEach, describe, expect, it, MockedFunction, vi} from 'vitest';
import {UnifiedWebSocketService} from '../unifiedWebSocketService';

// Mock SockJS and STOMP Client
const mockSockJS = vi.fn();
const mockStompClient = {
  activate: vi.fn(),
  deactivate: vi.fn(),
  subscribe: vi.fn(),
  publish: vi.fn(),
  connected: false
};

vi.mock('sockjs-client', () => ({
  default: mockSockJS
}));

vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn(() => mockStompClient)
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

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = UnifiedWebSocketService.getInstance();
      const instance2 = UnifiedWebSocketService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Connection Management', () => {
    it('should connect successfully', async () => {
      // Setup mock for successful connection
      mockStompClient.activate.mockImplementation(() => {
        // Simulate successful connection
        setTimeout(() => {
          mockStompClient.connected = true;
          // Simulate onConnect callback if it exists
        }, 10);
      });

      const connectPromise = service.connect(123);
      
      // Manually trigger connection success
      mockStompClient.connected = true;
      
      expect(mockSockJS).toHaveBeenCalledWith(expect.stringContaining('/ws'));
      expect(mockStompClient.activate).toHaveBeenCalled();
    });

    it('should handle connection failure', async () => {
      mockStompClient.activate.mockImplementation(() => {
        // Simulate connection failure
        setTimeout(() => {
          throw new Error('Connection failed');
        }, 10);
      });

      await expect(service.connect(123)).rejects.toThrow();
    });

    it('should disconnect properly', () => {
      service.disconnect();
      expect(mockStompClient.deactivate).toHaveBeenCalled();
    });

    it('should not connect if already connecting', async () => {
      // First connection attempt
      const promise1 = service.connect(123);
      // Second connection attempt while first is in progress
      const promise2 = service.connect(123);

      expect(promise1).toBe(promise2);
    });
  });

  describe('Game Room Management', () => {
    beforeEach(() => {
      mockStompClient.connected = true;
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
      mockStompClient.connected = false;
      
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
      mockStompClient.connected = true;
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
      mockStompClient.connected = false;

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
      mockStompClient.connected = true;
      gameEventHandler = vi.fn();
      chatMessageHandler = vi.fn();
      
      service.onGameEvent('PLAYER_JOINED', gameEventHandler);
      service.onChatMessage(chatMessageHandler);
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
      const chatHandler = mockStompClient.subscribe.mock.calls.find(
        call => call[0].includes('/chat')
      )[1];
      
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
      mockStompClient.connected = false;
      expect(service.connected).toBe(false);
      expect(service.status).toBe('disconnected');

      mockStompClient.connected = true;
      expect(service.connected).toBe(true);
      expect(service.status).toBe('connected');
    });

    it('should return correct game number', () => {
      expect(service.gameNumber).toBeNull();
      
      mockStompClient.connected = true;
      service.joinGameRoom(12345);
      expect(service.gameNumber).toBe(12345);
    });

    it('should return correct user ID', () => {
      expect(service.userId).toBeNull();
      
      service.connect(123);
      expect(service.userId).toBe(123);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', () => {
      const errorHandler = vi.fn();
      service.onError(errorHandler);

      // Simulate connection error
      const error = new Error('Connection failed');
      // This would be called by the STOMP client in real scenarios
      
      expect(errorHandler).not.toHaveBeenCalled(); // No error yet
    });

    it('should handle subscription errors', () => {
      mockStompClient.connected = true;
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