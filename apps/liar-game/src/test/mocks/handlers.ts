import {vi} from 'vitest';

// Mock handlers for testing
export const mockGameRoom = {
  id: 'test-room-1',
  name: '테스트 게임방',
  hostId: 'host-1',
  hostName: '호스트',
  hostAvatar: undefined,
  status: 'waiting' as const,
  currentPlayers: 3,
  maxPlayers: 6,
  isPrivate: false,
  hasPassword: false,
  settings: {
    roundTime: 300,
    discussionTime: 180,
    defenseTime: 60,
    allowSpectators: true,
  },
  players: [
    {
      id: 'player-1',
      name: '플레이어1',
      avatar: undefined,
      isReady: true,
    },
    {
      id: 'player-2',
      name: '플레이어2',
      avatar: undefined,
      isReady: false,
    },
    {
      id: 'player-3',
      name: '플레이어3',
      avatar: undefined,
      isReady: true,
    },
  ],
  createdAt: new Date('2024-01-01T10:00:00Z'),
  estimatedDuration: 15,
};

export const mockWebSocketMessage = {
  type: 'game_update',
  data: {
    roomId: 'test-room-1',
    players: mockGameRoom.players,
    status: 'playing',
  },
};

export const mockPlayer = {
  id: 'test-player-1',
  name: '테스트 플레이어',
  avatar: undefined,
  score: 100,
  role: 'citizen' as const,
  isAlive: true,
  votes: 0,
};

// Mock WebSocket implementation
export class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  readonly url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  send = vi.fn();
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    // Don't auto-connect in constructor to allow test control
  }

  // Helper methods for testing
  mockConnect() {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  mockDisconnect(code: number = 1000, reason: string = 'Normal closure') {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  mockMessage(data: any) {
    if (this.onmessage && this.readyState === MockWebSocket.OPEN) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  mockError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}