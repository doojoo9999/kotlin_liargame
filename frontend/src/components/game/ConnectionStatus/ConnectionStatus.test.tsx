import type {ReactNode} from 'react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@/test/utils/test-utils';
import {ConnectionStatus} from './ConnectionStatus';

type MockConnectionState = {
  status: 'idle' | 'connected' | 'error' | 'reconnecting';
  avgLatency?: number;
  messageQueue: Array<{ id: string }>;
  pendingMessages: Record<string, { id: string }>;
  syncIssues: Array<{ id: string }>;
  clearSyncIssues: () => void;
};

const createConnectionState = (overrides: Partial<MockConnectionState> = {}): MockConnectionState => ({
  status: 'idle',
  avgLatency: undefined,
  messageQueue: [],
  pendingMessages: {},
  syncIssues: [],
  clearSyncIssues: vi.fn(),
  ...overrides,
});

const connectionStoreState = vi.hoisted(() => ({
  state: createConnectionState(),
}));

vi.mock('@/stores/connectionStore', () => ({
  useConnectionStore: (selector: (state: MockConnectionState) => any) => selector(connectionStoreState.state),
}));

const webSocketState: {
  isConnected: boolean;
  connectionError: string | null;
  retry: ReturnType<typeof vi.fn>;
} = {
  isConnected: false,
  connectionError: null,
  retry: vi.fn(),
};

vi.mock('@/hooks/useGameWebSocket', () => ({
  useGameWebSocket: () => webSocketState,
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({children}: {children: ReactNode}) => <div data-testid="animate-presence">{children}</div>,
  motion: {
    div: ({children, layout: _layout, ...props}: any) => <div {...props}>{children}</div>,
  },
}));

describe('ConnectionStatus', () => {
  const resetConnectionState = () => {
    connectionStoreState.state = createConnectionState();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetConnectionState();
    webSocketState.isConnected = false;
    webSocketState.connectionError = null;
    webSocketState.retry = vi.fn();
  });

  it('renders degraded state when backlog exists', async () => {
    connectionStoreState.state.status = 'connected';
    connectionStoreState.state.messageQueue = [{ id: 'queued-1' }];
    connectionStoreState.state.pendingMessages = {};
    connectionStoreState.state.avgLatency = undefined;
    webSocketState.isConnected = true;

    const user = userEvent.setup();
    render(<ConnectionStatus showDetails />);

    expect(screen.getByText('연결 품질 저하')).toBeInTheDocument();
    expect(screen.getByText('대기 1건')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: '재연결' });
    await user.click(retryButton);

    expect(webSocketState.retry).toHaveBeenCalledTimes(1);
  });

  it('shows error details when connection error present', () => {
    connectionStoreState.state.status = 'error';
    connectionStoreState.state.messageQueue = [];
    connectionStoreState.state.pendingMessages = {};
    webSocketState.connectionError = '타임아웃';

    render(<ConnectionStatus showDetails />);

    expect(screen.getByText('연결 오류')).toBeInTheDocument();
    expect(screen.getByText('타임아웃')).toBeInTheDocument();
  });
});
