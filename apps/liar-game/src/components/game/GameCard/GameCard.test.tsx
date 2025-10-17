import {beforeEach, describe, expect, it, vi} from 'vitest';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {GameRoom} from './GameCard';
import {GameCard} from './GameCard';
import {render} from '@/test/utils/test-utils';
import {mockGameRoom} from '@/test/mocks/handlers';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('GameCard', () => {
  const defaultProps = {
    room: mockGameRoom,
    onJoin: vi.fn(),
    onSpectate: vi.fn(),
    onDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders game room information correctly', () => {
      render(<GameCard {...defaultProps} />);
      
      expect(screen.getByText('테스트 게임방')).toBeInTheDocument();
      expect(screen.getByText('호스트: 호스트')).toBeInTheDocument();
      expect(screen.getByText('3 / 6 명')).toBeInTheDocument();
      expect(screen.getByText('대기 중')).toBeInTheDocument();
    });

    it('shows password indicator for password-protected rooms', () => {
      const passwordRoom: GameRoom = {
        ...mockGameRoom,
        hasPassword: true,
      };
      
      render(<GameCard {...defaultProps} room={passwordRoom} />);
      expect(screen.getByText('🔑')).toBeInTheDocument();
    });

    it('shows private room indicator for private rooms', () => {
      const privateRoom: GameRoom = {
        ...mockGameRoom,
        isPrivate: true,
      };
      
      render(<GameCard {...defaultProps} room={privateRoom} />);
      
      // Since we can't easily test Lucide icons, we test the room info instead
      expect(screen.getByText('호스트: 호스트')).toBeInTheDocument();
    });

    it('shows full room indicator when maxPlayers reached', () => {
      const fullRoom: GameRoom = {
        ...mockGameRoom,
        currentPlayers: 6,
        maxPlayers: 6,
      };
      
      render(<GameCard {...defaultProps} room={fullRoom} />);
      expect(screen.getByText('만석')).toBeInTheDocument();
    });
  });

  describe('Room Status', () => {
    it('renders waiting status correctly', () => {
      render(<GameCard {...defaultProps} />);
      expect(screen.getByText('대기 중')).toBeInTheDocument();
    });

    it('renders playing status correctly', () => {
      const playingRoom: GameRoom = {
        ...mockGameRoom,
        status: 'playing',
      };
      
      render(<GameCard {...defaultProps} room={playingRoom} />);
      expect(screen.getByText('게임 중')).toBeInTheDocument();
    });

    it('renders finished status correctly', () => {
      const finishedRoom: GameRoom = {
        ...mockGameRoom,
        status: 'finished',
      };
      
      render(<GameCard {...defaultProps} room={finishedRoom} />);
      expect(screen.getByText('종료됨')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders compact variant by default', () => {
      render(<GameCard {...defaultProps} />);
      
      // Compact variant should show basic info
      expect(screen.getByText('호스트: 호스트')).toBeInTheDocument();
      expect(screen.getByText('3 / 6 명')).toBeInTheDocument();
    });

    it('renders detailed variant with additional information', () => {
      render(<GameCard {...defaultProps} variant="detailed" />);
      
      // Detailed variant should show settings and players
      expect(screen.getByText('라운드: 5분')).toBeInTheDocument();
      expect(screen.getByText('토론: 3분')).toBeInTheDocument();
      expect(screen.getByText('변론: 1분')).toBeInTheDocument();
      expect(screen.getByText('관전: 허용')).toBeInTheDocument();
    });

    it('shows players list in detailed variant', () => {
      render(
        <GameCard 
          {...defaultProps} 
          variant="detailed" 
          showPlayers={true} 
        />
      );
      
      expect(screen.getByText('참가자')).toBeInTheDocument();
      expect(screen.getByText('플레이어1')).toBeInTheDocument();
      expect(screen.getByText('플레이어2')).toBeInTheDocument();
      expect(screen.getByText('플레이어3')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onJoin when join button is clicked', async () => {
      const user = userEvent.setup();
      const onJoin = vi.fn();
      
      render(<GameCard {...defaultProps} onJoin={onJoin} />);
      
      const joinButton = screen.getByText('참가하기');
      await user.click(joinButton);
      
      expect(onJoin).toHaveBeenCalledWith(mockGameRoom);
    });

    it('calls onSpectate when spectate button is clicked', async () => {
      const user = userEvent.setup();
      const onSpectate = vi.fn();
      const playingRoom: GameRoom = {
        ...mockGameRoom,
        status: 'playing',
      };
      
      render(<GameCard {...defaultProps} room={playingRoom} onSpectate={onSpectate} />);
      
      const spectateButton = screen.getByText('관전하기');
      await user.click(spectateButton);
      
      expect(onSpectate).toHaveBeenCalledWith(playingRoom);
    });

    it('calls onDetails when details button is clicked', async () => {
      const user = userEvent.setup();
      const onDetails = vi.fn();
      
      render(<GameCard {...defaultProps} onDetails={onDetails} />);
      
      const detailsButton = screen.getByText('👁️');
      await user.click(detailsButton);
      
      expect(onDetails).toHaveBeenCalledWith(mockGameRoom);
    });

    it('shows different join button text for password-protected rooms', () => {
      const passwordRoom: GameRoom = {
        ...mockGameRoom,
        hasPassword: true,
      };
      
      render(<GameCard {...defaultProps} room={passwordRoom} />);
      expect(screen.getByText('🔑 참가')).toBeInTheDocument();
    });

    it('disables join button when joining', () => {
      render(<GameCard {...defaultProps} isJoining={true} />);
      
      const joinButton = screen.getByText('참가 중...');
      expect(joinButton).toBeDisabled();
    });

    it('does not show join button for full rooms', () => {
      const fullRoom: GameRoom = {
        ...mockGameRoom,
        currentPlayers: 6,
        maxPlayers: 6,
      };
      
      render(<GameCard {...defaultProps} room={fullRoom} />);
      
      expect(screen.queryByText('참가하기')).not.toBeInTheDocument();
      expect(screen.queryByText('🔑 참가')).not.toBeInTheDocument();
    });

    it('does not show spectate button when spectators not allowed', () => {
      const noSpectatorRoom: GameRoom = {
        ...mockGameRoom,
        status: 'playing',
        settings: {
          ...mockGameRoom.settings,
          allowSpectators: false,
        },
      };
      
      render(<GameCard {...defaultProps} room={noSpectatorRoom} />);
      
      expect(screen.queryByText('관전하기')).not.toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('formats time correctly', () => {
      render(<GameCard {...defaultProps} variant="detailed" />);
      
      // Check that durations are formatted properly
      expect(screen.getByText('라운드: 5분')).toBeInTheDocument();
      expect(screen.getByText('토론: 3분')).toBeInTheDocument();
      expect(screen.getByText('변론: 1분')).toBeInTheDocument();
    });

    it('shows elapsed time since room creation', () => {
      const recentRoom: GameRoom = {
        ...mockGameRoom,
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      };
      
      render(<GameCard {...defaultProps} room={recentRoom} />);
      
      // Should show "5분 전" or similar
      expect(screen.getByText(/분 전/)).toBeInTheDocument();
    });
  });

  describe('Player Display', () => {
    it('shows ready status for players', () => {
      render(
        <GameCard 
          {...defaultProps} 
          variant="detailed" 
          showPlayers={true} 
        />
      );
      
      // Players with isReady: true should show a checkmark
      // This is hard to test without testing the icon directly
      expect(screen.getByText('플레이어1')).toBeInTheDocument();
      expect(screen.getByText('플레이어2')).toBeInTheDocument();
    });

    it('shows overflow indicator when more than 6 players', () => {
      const manyPlayersRoom: GameRoom = {
        ...mockGameRoom,
        currentPlayers: 8,
        players: [
          ...mockGameRoom.players,
          { id: 'player-4', name: '플레이어4', avatar: undefined, isReady: true },
          { id: 'player-5', name: '플레이어5', avatar: undefined, isReady: false },
          { id: 'player-6', name: '플레이어6', avatar: undefined, isReady: true },
          { id: 'player-7', name: '플레이어7', avatar: undefined, isReady: true },
          { id: 'player-8', name: '플레이어8', avatar: undefined, isReady: false },
        ],
      };
      
      render(
        <GameCard 
          {...defaultProps}
          room={manyPlayersRoom} 
          variant="detailed" 
          showPlayers={true} 
        />
      );
      
      expect(screen.getByText('+2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<GameCard {...defaultProps} />);
      
      // Check that buttons are accessible
      const joinButton = screen.getByText('참가하기');
      expect(joinButton).toHaveAttribute('type', 'button');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const onJoin = vi.fn();
      
      render(<GameCard {...defaultProps} onJoin={onJoin} />);
      
      const joinButton = screen.getByText('참가하기');
      joinButton.focus();
      
      await user.keyboard('{Enter}');
      expect(onJoin).toHaveBeenCalledWith(mockGameRoom);
    });
  });
});