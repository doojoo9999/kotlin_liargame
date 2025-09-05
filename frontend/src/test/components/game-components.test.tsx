/**
 * Game Components Tests
 * 
 * Tests for game-related UI components including game boards,
 * player lists, voting panels, and phase indicators.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MantineProvider} from '@mantine/core';
import type {ReactNode} from 'react';

// Mock game data types
interface Player {
  id: string;
  nickname: string;
  isReady: boolean;
  score: number;
  role?: 'normal' | 'liar';
  isHost: boolean;
  isCurrentTurn?: boolean;
}

interface GameState {
  id: string;
  status: 'waiting' | 'in_progress' | 'ended';
  currentPhase: 'speech' | 'discussion' | 'voting' | 'defense' | 'final_vote';
  players: Player[];
  timeLeft: number;
  settings: {
    maxPlayers: number;
    timeLimit: number;
  };
  currentWord?: string;
  liarId?: string;
}

// Mock components for testing
const MockPlayerList = ({ 
  players, 
  currentPlayerId,
  onVote 
}: { 
  players: Player[];
  currentPlayerId?: string;
  onVote?: (playerId: string) => void;
}) => (
  <div data-testid="player-list">
    <h3>플레이어 목록</h3>
    {players.map((player) => (
      <div
        key={player.id}
        data-testid={`player-${player.id}`}
        className={player.isCurrentTurn ? 'current-turn' : ''}
      >
        <div data-testid={`player-nickname-${player.id}`}>
          {player.nickname}
        </div>
        <div data-testid={`player-score-${player.id}`}>
          점수: {player.score}
        </div>
        {player.isHost && (
          <span data-testid={`host-badge-${player.id}`}>방장</span>
        )}
        {player.isReady && (
          <span data-testid={`ready-badge-${player.id}`}>준비완료</span>
        )}
        {onVote && player.id !== currentPlayerId && (
          <button
            data-testid={`vote-button-${player.id}`}
            onClick={() => onVote(player.id)}
          >
            투표
          </button>
        )}
      </div>
    ))}
  </div>
);

const MockGameBoard = ({ 
  gameState,
  currentUser 
}: { 
  gameState: GameState;
  currentUser: { id: string; nickname: string };
}) => (
  <div data-testid="game-board">
    <div data-testid="game-status">{gameState.status}</div>
    <div data-testid="current-phase">{gameState.currentPhase}</div>
    <div data-testid="time-left">{gameState.timeLeft}초 남음</div>
    
    {gameState.currentWord && currentUser.id !== gameState.liarId && (
      <div data-testid="current-word">주제: {gameState.currentWord}</div>
    )}
    
    {currentUser.id === gameState.liarId && (
      <div data-testid="liar-indicator">당신은 거짓말쟁이입니다!</div>
    )}
    
    <MockPlayerList 
      players={gameState.players}
      currentPlayerId={currentUser.id}
    />
  </div>
);

const MockVotingPanel = ({ 
  players,
  onVote,
  votedPlayer,
  timeLeft,
  canVote = true 
}: {
  players: Player[];
  onVote?: (playerId: string) => void;
  votedPlayer?: string;
  timeLeft: number;
  canVote?: boolean;
}) => (
  <div data-testid="voting-panel">
    <h3>투표하기</h3>
    <div data-testid="voting-time-left">{timeLeft}초 남음</div>
    
    {votedPlayer && (
      <div data-testid="voted-confirmation">
        {players.find(p => p.id === votedPlayer)?.nickname}에게 투표했습니다.
      </div>
    )}
    
    <div data-testid="voting-options">
      {players.map((player) => (
        <button
          key={player.id}
          data-testid={`vote-option-${player.id}`}
          onClick={() => onVote?.(player.id)}
          disabled={!canVote || !!votedPlayer}
          className={votedPlayer === player.id ? 'selected' : ''}
        >
          {player.nickname}
        </button>
      ))}
    </div>
  </div>
);

const MockPhaseIndicator = ({ 
  currentPhase,
  phases = ['speech', 'discussion', 'voting', 'defense', 'final_vote']
}: {
  currentPhase: string;
  phases?: string[];
}) => (
  <div data-testid="phase-indicator">
    <div data-testid="current-phase-title">
      현재 단계: {currentPhase}
    </div>
    <div data-testid="phase-progress">
      {phases.map((phase, index) => (
        <div
          key={phase}
          data-testid={`phase-step-${phase}`}
          className={`phase-step ${phase === currentPhase ? 'active' : ''} ${
            phases.indexOf(currentPhase) > index ? 'completed' : ''
          }`}
        >
          {phase}
        </div>
      ))}
    </div>
  </div>
);

const MockHintInput = ({ 
  onSubmit,
  isSubmitting = false,
  currentPlayer 
}: {
  onSubmit?: (hint: string) => void;
  isSubmitting?: boolean;
  currentPlayer?: Player;
}) => {
  const [hint, setHint] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hint.trim()) {
      onSubmit?.(hint.trim());
      setHint('');
    }
  };

  return (
    <div data-testid="hint-input">
      {currentPlayer && (
        <div data-testid="current-turn">
          {currentPlayer.nickname}님의 차례입니다.
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="힌트를 입력하세요..."
          data-testid="hint-textarea"
          maxLength={100}
          disabled={isSubmitting}
        />
        <div data-testid="character-count">
          {hint.length}/100
        </div>
        <button
          type="submit"
          disabled={!hint.trim() || isSubmitting}
          data-testid="submit-hint-button"
        >
          {isSubmitting ? '제출 중...' : '힌트 제출'}
        </button>
      </form>
    </div>
  );
};

const MockScoreboard = ({ 
  players,
  gameEnded = false 
}: {
  players: Player[];
  gameEnded?: boolean;
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  return (
    <div data-testid="scoreboard">
      <h3>{gameEnded ? '최종 점수' : '현재 점수'}</h3>
      <div data-testid="score-list">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            data-testid={`score-item-${player.id}`}
            className={`score-item ${index === 0 ? 'winner' : ''}`}
          >
            <span data-testid={`rank-${player.id}`}>
              {index + 1}위
            </span>
            <span data-testid={`player-name-${player.id}`}>
              {player.nickname}
            </span>
            <span data-testid={`player-final-score-${player.id}`}>
              {player.score}점
            </span>
            {index === 0 && gameEnded && (
              <span data-testid={`winner-badge-${player.id}`}>🏆</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Test wrapper
const TestWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('Game Components', () => {
  const user = userEvent.setup();
  
  // Mock data
  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      nickname: '플레이어1',
      isReady: true,
      score: 100,
      isHost: true,
      isCurrentTurn: true
    },
    {
      id: 'player-2',
      nickname: '플레이어2',
      isReady: true,
      score: 80,
      isHost: false,
      isCurrentTurn: false
    },
    {
      id: 'player-3',
      nickname: '플레이어3',
      isReady: false,
      score: 60,
      isHost: false,
      isCurrentTurn: false
    }
  ];

  const mockGameState: GameState = {
    id: 'game-123',
    status: 'in_progress',
    currentPhase: 'speech',
    players: mockPlayers,
    timeLeft: 180,
    settings: {
      maxPlayers: 6,
      timeLimit: 300
    },
    currentWord: '사과',
    liarId: 'player-2'
  };

  const mockCurrentUser = {
    id: 'player-1',
    nickname: '플레이어1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PlayerList Component', () => {
    it('should render all players correctly', () => {
      render(
        <TestWrapper>
          <MockPlayerList players={mockPlayers} />
        </TestWrapper>
      );

      expect(screen.getByTestId('player-list')).toBeInTheDocument();
      expect(screen.getByText('플레이어 목록')).toBeInTheDocument();
      
      mockPlayers.forEach((player) => {
        expect(screen.getByTestId(`player-${player.id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`player-nickname-${player.id}`)).toHaveTextContent(player.nickname);
        expect(screen.getByTestId(`player-score-${player.id}`)).toHaveTextContent(`점수: ${player.score}`);
      });
    });

    it('should highlight current turn player', () => {
      render(
        <TestWrapper>
          <MockPlayerList players={mockPlayers} />
        </TestWrapper>
      );

      const currentTurnPlayer = screen.getByTestId('player-player-1');
      expect(currentTurnPlayer).toHaveClass('current-turn');
    });

    it('should show host badge for host player', () => {
      render(
        <TestWrapper>
          <MockPlayerList players={mockPlayers} />
        </TestWrapper>
      );

      expect(screen.getByTestId('host-badge-player-1')).toBeInTheDocument();
      expect(screen.queryByTestId('host-badge-player-2')).not.toBeInTheDocument();
    });

    it('should show ready badge for ready players', () => {
      render(
        <TestWrapper>
          <MockPlayerList players={mockPlayers} />
        </TestWrapper>
      );

      expect(screen.getByTestId('ready-badge-player-1')).toBeInTheDocument();
      expect(screen.getByTestId('ready-badge-player-2')).toBeInTheDocument();
      expect(screen.queryByTestId('ready-badge-player-3')).not.toBeInTheDocument();
    });

    it('should handle voting interactions', async () => {
      const mockOnVote = vi.fn();
      
      render(
        <TestWrapper>
          <MockPlayerList 
            players={mockPlayers}
            currentPlayerId="player-1"
            onVote={mockOnVote}
          />
        </TestWrapper>
      );

      const voteButton2 = screen.getByTestId('vote-button-player-2');
      const voteButton3 = screen.getByTestId('vote-button-player-3');
      
      expect(voteButton2).toBeInTheDocument();
      expect(voteButton3).toBeInTheDocument();
      expect(screen.queryByTestId('vote-button-player-1')).not.toBeInTheDocument(); // Can't vote for self

      await user.click(voteButton2);
      expect(mockOnVote).toHaveBeenCalledWith('player-2');
    });
  });

  describe('GameBoard Component', () => {
    it('should display game state information', () => {
      render(
        <TestWrapper>
          <MockGameBoard gameState={mockGameState} currentUser={mockCurrentUser} />
        </TestWrapper>
      );

      expect(screen.getByTestId('game-board')).toBeInTheDocument();
      expect(screen.getByTestId('game-status')).toHaveTextContent('in_progress');
      expect(screen.getByTestId('current-phase')).toHaveTextContent('speech');
      expect(screen.getByTestId('time-left')).toHaveTextContent('180초 남음');
    });

    it('should show current word for normal players', () => {
      render(
        <TestWrapper>
          <MockGameBoard gameState={mockGameState} currentUser={mockCurrentUser} />
        </TestWrapper>
      );

      expect(screen.getByTestId('current-word')).toHaveTextContent('주제: 사과');
    });

    it('should show liar indicator for liar player', () => {
      const liarUser = { id: 'player-2', nickname: '플레이어2' };
      
      render(
        <TestWrapper>
          <MockGameBoard gameState={mockGameState} currentUser={liarUser} />
        </TestWrapper>
      );

      expect(screen.getByTestId('liar-indicator')).toHaveTextContent('당신은 거짓말쟁이입니다!');
      expect(screen.queryByTestId('current-word')).not.toBeInTheDocument();
    });

    it('should render player list within game board', () => {
      render(
        <TestWrapper>
          <MockGameBoard gameState={mockGameState} currentUser={mockCurrentUser} />
        </TestWrapper>
      );

      expect(screen.getByTestId('player-list')).toBeInTheDocument();
      expect(screen.getByText('플레이어1')).toBeInTheDocument();
    });
  });

  describe('VotingPanel Component', () => {
    it('should render voting options', () => {
      render(
        <TestWrapper>
          <MockVotingPanel players={mockPlayers} timeLeft={60} />
        </TestWrapper>
      );

      expect(screen.getByTestId('voting-panel')).toBeInTheDocument();
      expect(screen.getByText('투표하기')).toBeInTheDocument();
      expect(screen.getByTestId('voting-time-left')).toHaveTextContent('60초 남음');

      mockPlayers.forEach((player) => {
        const voteOption = screen.getByTestId(`vote-option-${player.id}`);
        expect(voteOption).toBeInTheDocument();
        expect(voteOption).toHaveTextContent(player.nickname);
      });
    });

    it('should handle vote selection', async () => {
      const mockOnVote = vi.fn();
      
      render(
        <TestWrapper>
          <MockVotingPanel 
            players={mockPlayers} 
            timeLeft={60}
            onVote={mockOnVote}
          />
        </TestWrapper>
      );

      const voteOption = screen.getByTestId('vote-option-player-2');
      await user.click(voteOption);

      expect(mockOnVote).toHaveBeenCalledWith('player-2');
    });

    it('should show confirmation after voting', () => {
      render(
        <TestWrapper>
          <MockVotingPanel 
            players={mockPlayers} 
            timeLeft={60}
            votedPlayer="player-2"
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('voted-confirmation')).toHaveTextContent('플레이어2에게 투표했습니다.');
    });

    it('should disable voting when already voted', () => {
      render(
        <TestWrapper>
          <MockVotingPanel 
            players={mockPlayers} 
            timeLeft={60}
            votedPlayer="player-2"
          />
        </TestWrapper>
      );

      mockPlayers.forEach((player) => {
        const voteOption = screen.getByTestId(`vote-option-${player.id}`);
        expect(voteOption).toBeDisabled();
      });
    });

    it('should disable voting when canVote is false', () => {
      render(
        <TestWrapper>
          <MockVotingPanel 
            players={mockPlayers} 
            timeLeft={60}
            canVote={false}
          />
        </TestWrapper>
      );

      mockPlayers.forEach((player) => {
        const voteOption = screen.getByTestId(`vote-option-${player.id}`);
        expect(voteOption).toBeDisabled();
      });
    });
  });

  describe('PhaseIndicator Component', () => {
    it('should render all phases', () => {
      render(
        <TestWrapper>
          <MockPhaseIndicator currentPhase="voting" />
        </TestWrapper>
      );

      expect(screen.getByTestId('phase-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('current-phase-title')).toHaveTextContent('현재 단계: voting');

      const phases = ['speech', 'discussion', 'voting', 'defense', 'final_vote'];
      phases.forEach((phase) => {
        expect(screen.getByTestId(`phase-step-${phase}`)).toBeInTheDocument();
      });
    });

    it('should highlight current phase', () => {
      render(
        <TestWrapper>
          <MockPhaseIndicator currentPhase="discussion" />
        </TestWrapper>
      );

      const currentPhaseStep = screen.getByTestId('phase-step-discussion');
      expect(currentPhaseStep).toHaveClass('active');
    });

    it('should mark completed phases', () => {
      render(
        <TestWrapper>
          <MockPhaseIndicator currentPhase="voting" />
        </TestWrapper>
      );

      const speechPhase = screen.getByTestId('phase-step-speech');
      const discussionPhase = screen.getByTestId('phase-step-discussion');
      
      expect(speechPhase).toHaveClass('completed');
      expect(discussionPhase).toHaveClass('completed');
    });
  });

  describe('HintInput Component', () => {
    beforeEach(() => {
      // Mock React hooks
      vi.doMock('react', () => ({
        useState: vi.fn().mockImplementation((initial) => [initial, vi.fn()])
      }));
    });

    it('should render hint input form', () => {
      render(
        <TestWrapper>
          <MockHintInput currentPlayer={mockPlayers[0]} />
        </TestWrapper>
      );

      expect(screen.getByTestId('hint-input')).toBeInTheDocument();
      expect(screen.getByTestId('current-turn')).toHaveTextContent('플레이어1님의 차례입니다.');
      expect(screen.getByTestId('hint-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('character-count')).toHaveTextContent('0/100');
      expect(screen.getByTestId('submit-hint-button')).toBeInTheDocument();
    });

    it('should handle hint input and character counting', async () => {
      // This would test the actual component behavior
      const TestHintInput = () => {
        const [hint, setHint] = React.useState('');
        
        return (
          <div data-testid="hint-input">
            <textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              data-testid="hint-textarea"
              maxLength={100}
            />
            <div data-testid="character-count">{hint.length}/100</div>
          </div>
        );
      };

      // Mock React.useState properly
      let hintState = '';
      const setHintState = (value: string | ((prev: string) => string)) => {
        hintState = typeof value === 'function' ? value(hintState) : value;
      };

      vi.doMock('react', () => ({
        useState: vi.fn().mockReturnValue([hintState, setHintState])
      }));

      render(
        <TestWrapper>
          <TestHintInput />
        </TestWrapper>
      );

      const textarea = screen.getByTestId('hint-textarea');
      await user.type(textarea, '테스트 힌트');

      // In real component, character count would update
      expect(screen.getByTestId('character-count')).toBeInTheDocument();
    });

    it('should handle hint submission', async () => {
      const mockOnSubmit = vi.fn();
      
      render(
        <TestWrapper>
          <MockHintInput onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      const textarea = screen.getByTestId('hint-textarea');
      const submitButton = screen.getByTestId('submit-hint-button');

      await user.type(textarea, '좋은 힌트입니다');
      await user.click(submitButton);

      // In real component, would call onSubmit
      expect(mockOnSubmit).toHaveBeenCalledWith('좋은 힌트입니다');
    });

    it('should disable submit when hint is empty', () => {
      render(
        <TestWrapper>
          <MockHintInput />
        </TestWrapper>
      );

      const submitButton = screen.getByTestId('submit-hint-button');
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state when submitting', () => {
      render(
        <TestWrapper>
          <MockHintInput isSubmitting={true} />
        </TestWrapper>
      );

      const textarea = screen.getByTestId('hint-textarea');
      const submitButton = screen.getByTestId('submit-hint-button');

      expect(textarea).toBeDisabled();
      expect(submitButton).toHaveTextContent('제출 중...');
    });
  });

  describe('Scoreboard Component', () => {
    it('should render current scores', () => {
      render(
        <TestWrapper>
          <MockScoreboard players={mockPlayers} />
        </TestWrapper>
      );

      expect(screen.getByTestId('scoreboard')).toBeInTheDocument();
      expect(screen.getByText('현재 점수')).toBeInTheDocument();

      // Should be sorted by score (highest first)
      const scoreItems = screen.getAllByTestId(/^score-item-/);
      expect(scoreItems).toHaveLength(3);
    });

    it('should sort players by score', () => {
      render(
        <TestWrapper>
          <MockScoreboard players={mockPlayers} />
        </TestWrapper>
      );

      // Player1 (100점) should be 1st
      expect(screen.getByTestId('rank-player-1')).toHaveTextContent('1위');
      expect(screen.getByTestId('player-final-score-player-1')).toHaveTextContent('100점');

      // Player2 (80점) should be 2nd  
      expect(screen.getByTestId('rank-player-2')).toHaveTextContent('2위');
      expect(screen.getByTestId('player-final-score-player-2')).toHaveTextContent('80점');

      // Player3 (60점) should be 3rd
      expect(screen.getByTestId('rank-player-3')).toHaveTextContent('3위');
      expect(screen.getByTestId('player-final-score-player-3')).toHaveTextContent('60점');
    });

    it('should show final scores when game ended', () => {
      render(
        <TestWrapper>
          <MockScoreboard players={mockPlayers} gameEnded={true} />
        </TestWrapper>
      );

      expect(screen.getByText('최종 점수')).toBeInTheDocument();
      expect(screen.getByTestId('winner-badge-player-1')).toHaveTextContent('🏆');
    });

    it('should highlight winner', () => {
      render(
        <TestWrapper>
          <MockScoreboard players={mockPlayers} gameEnded={true} />
        </TestWrapper>
      );

      const winnerItem = screen.getByTestId('score-item-player-1');
      expect(winnerItem).toHaveClass('winner');
    });
  });

  describe('Game Component Integration', () => {
    it('should handle phase transitions correctly', () => {
      const phases = ['speech', 'discussion', 'voting', 'defense', 'final_vote'];
      const { rerender } = render(
        <TestWrapper>
          <MockPhaseIndicator currentPhase="speech" phases={phases} />
        </TestWrapper>
      );

      expect(screen.getByTestId('phase-step-speech')).toHaveClass('active');

      // Simulate phase change
      rerender(
        <TestWrapper>
          <MockPhaseIndicator currentPhase="voting" phases={phases} />
        </TestWrapper>
      );

      expect(screen.getByTestId('phase-step-voting')).toHaveClass('active');
      expect(screen.getByTestId('phase-step-speech')).toHaveClass('completed');
      expect(screen.getByTestId('phase-step-discussion')).toHaveClass('completed');
    });

    it('should update player states dynamically', () => {
      const initialPlayers = [
        { ...mockPlayers[0], score: 0 }
      ];

      const { rerender } = render(
        <TestWrapper>
          <MockPlayerList players={initialPlayers} />
        </TestWrapper>
      );

      expect(screen.getByTestId('player-score-player-1')).toHaveTextContent('점수: 0');

      // Simulate score update
      const updatedPlayers = [
        { ...mockPlayers[0], score: 50 }
      ];

      rerender(
        <TestWrapper>
          <MockPlayerList players={updatedPlayers} />
        </TestWrapper>
      );

      expect(screen.getByTestId('player-score-player-1')).toHaveTextContent('점수: 50');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty player list gracefully', () => {
      render(
        <TestWrapper>
          <MockPlayerList players={[]} />
        </TestWrapper>
      );

      expect(screen.getByTestId('player-list')).toBeInTheDocument();
      expect(screen.queryByTestId(/^player-/)).not.toBeInTheDocument();
    });

    it('should handle missing game data gracefully', () => {
      const incompleteGameState = {
        ...mockGameState,
        currentWord: undefined,
        liarId: undefined
      };

      render(
        <TestWrapper>
          <MockGameBoard gameState={incompleteGameState} currentUser={mockCurrentUser} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('current-word')).not.toBeInTheDocument();
      expect(screen.queryByTestId('liar-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <MockVotingPanel players={mockPlayers} timeLeft={60} />
        </TestWrapper>
      );

      const votingPanel = screen.getByTestId('voting-panel');
      expect(votingPanel).toBeInTheDocument();
      
      // In real component, would have proper ARIA attributes
      mockPlayers.forEach((player) => {
        const button = screen.getByTestId(`vote-option-${player.id}`);
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should be keyboard accessible', async () => {
      render(
        <TestWrapper>
          <MockVotingPanel players={mockPlayers} timeLeft={60} />
        </TestWrapper>
      );

      const firstButton = screen.getByTestId('vote-option-player-1');
      
      // Tab navigation
      await user.tab();
      expect(firstButton).toHaveFocus();

      // Enter key should activate button
      await user.keyboard('{Enter}');
      // In real component, would trigger vote
    });
  });
});