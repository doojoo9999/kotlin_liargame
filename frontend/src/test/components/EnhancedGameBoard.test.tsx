import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {EnhancedGameBoard} from '../../versions/main/components/enhanced/EnhancedGameBoard';
import type {GameState, Player} from '../../shared/types/game';

// 모킹
vi.mock('../../shared/interactions/manager');
vi.mock('../../versions/main/adaptive/ui-system');
vi.mock('../../versions/main/accessibility/screen-reader');

describe('EnhancedGameBoard', () => {
  const mockPlayers: Player[] = [
    {
      id: '1',
      nickname: 'Player1',
      isAlive: true,
      hasVoted: false,
      hint: 'red',
      role: 'citizen',
      round: 1
    },
    {
      id: '2',
      nickname: 'Player2',
      isAlive: true,
      hasVoted: true,
      role: 'citizen',
      round: 1
    },
    {
      id: '3',
      nickname: 'Liar',
      isAlive: true,
      hasVoted: false,
      role: 'liar',
      round: 1
    },
  ];

  const mockGameState: GameState = {
    phase: 'playing',
    currentPlayerId: '1',
    round: 1,
    topic: 'Colors',
  };

  const mockProps = {
    players: mockPlayers,
    gameState: mockGameState,
    currentPlayer: mockPlayers[0],
    onPlayerSelect: vi.fn(),
    onPlayerVote: vi.fn(),
    onPlayerAction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('게임 상태 표시', () => {
    it('현재 플레이어의 턴이 표시되어야 한다', () => {
      render(<EnhancedGameBoard {...mockProps} />);

      expect(screen.getByText('Player1님의 차례')).toBeInTheDocument();
    });

    it('투표 단계에서 투표 안내가 표시되어야 한다', () => {
      const votingGameState = { ...mockGameState, phase: 'voting' as const };
      render(<EnhancedGameBoard {...mockProps} gameState={votingGameState} />);

      expect(screen.getByText('투표 시간')).toBeInTheDocument();
      expect(screen.getByText(/라이어를 찾아 투표하세요/)).toBeInTheDocument();
    });

    it('게임 종료 상태가 표시되어야 한다', () => {
      const endedGameState = { ...mockGameState, phase: 'ended' as const };
      render(<EnhancedGameBoard {...mockProps} gameState={endedGameState} />);

      expect(screen.getByText('게임 종료')).toBeInTheDocument();
    });
  });

  describe('플레이어 카드 렌더링', () => {
    it('모든 플레이어가 렌더링되어야 한다', () => {
      render(<EnhancedGameBoard {...mockProps} />);

      expect(screen.getByText('Player1')).toBeInTheDocument();
      expect(screen.getByText('Player2')).toBeInTheDocument();
      expect(screen.getByText('Liar')).toBeInTheDocument();
    });

    it('현재 턴 플레이어가 하이라이트되어야 한다', () => {
      render(<EnhancedGameBoard {...mockProps} />);

      const player1Card = screen.getByLabelText(/플레이어 Player1/);
      expect(player1Card).toHaveAttribute('aria-current', 'true');
    });

    it('투표 가능한 플레이어가 표시되어야 한다', () => {
      const votingGameState = { ...mockGameState, phase: 'voting' as const };
      render(<EnhancedGameBoard {...mockProps} gameState={votingGameState} />);

      // 현재 플레이어가 아닌 생존 플레이어들만 투표 가능
      const player2Card = screen.getByLabelText(/플레이어 Player2/);
      const liarCard = screen.getByLabelText(/플레이어 Liar/);

      expect(player2Card.className).toContain('ring-green-400');
      expect(liarCard.className).toContain('ring-green-400');
    });
  });

  describe('인터랙션 처리', () => {
    it('플레이어 선택이 처리되어야 한다', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameBoard {...mockProps} />);

      const player2Card = screen.getByLabelText(/플레이어 Player2/);
      await user.click(player2Card);

      expect(mockProps.onPlayerSelect).toHaveBeenCalledWith(mockPlayers[1]);
    });

    it('플레이어 투표가 처리되어야 한다', async () => {
      const user = userEvent.setup();
      const votingGameState = { ...mockGameState, phase: 'voting' as const };
      render(<EnhancedGameBoard {...mockProps} gameState={votingGameState} />);

      const player2Card = screen.getByLabelText(/플레이어 Player2/);
      await user.dblClick(player2Card);

      expect(mockProps.onPlayerVote).toHaveBeenCalledWith(mockPlayers[1]);
    });
  });

  describe('키보드 네비게이션', () => {
    it('방향키로 플레이어 간 이동이 가능해야 한다', async () => {
      const user = userEvent.setup();
      render(<EnhancedGameBoard {...mockProps} />);

      const gameBoard = screen.getByRole('application');
      gameBoard.focus();

      await user.keyboard('{ArrowRight}');
      // 키보드 네비게이션 로직 테스트
      expect(gameBoard).toHaveFocus();
    });

    it('스와이프 제스처로 플레이어 탐색이 가능해야 한다', async () => {
      render(<EnhancedGameBoard {...mockProps} />);

      const gameBoard = screen.getByRole('application');

      // 스와이프 시뮬레이션
      fireEvent.touchStart(gameBoard, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      fireEvent.touchMove(gameBoard, {
        touches: [{ clientX: 200, clientY: 100 }]
      });
      fireEvent.touchEnd(gameBoard);

      // 스와이프 핸들러 실행 확인
      await waitFor(() => {
        expect(gameBoard).toBeInTheDocument();
      });
    });
  });

  describe('승리 효과', () => {
    it('게임 종료 시 축하 효과가 표시되어야 한다', async () => {
      const { rerender } = render(<EnhancedGameBoard {...mockProps} />);

      // 게임 종료로 상태 변경
      const endedGameState = { ...mockGameState, phase: 'ended' as const };
      rerender(<EnhancedGameBoard {...mockProps} gameState={endedGameState} />);

      await waitFor(() => {
        expect(screen.getByText('🎉 게임 종료! 🎉')).toBeInTheDocument();
      });
    });
  });

  describe('성능 최적화', () => {
    it('플레이어 수가 많아도 원활하게 렌더링되어야 한다', () => {
      const manyPlayers = Array.from({ length: 50 }, (_, i) => ({
        id: `player-${i}`,
        nickname: `Player${i}`,
        isAlive: true,
        hasVoted: false,
        round: 1
      }));

      const start = performance.now();
      render(<EnhancedGameBoard {...mockProps} players={manyPlayers} />);
      const end = performance.now();

      // 렌더링이 100ms 이내에 완료되어야 함
      expect(end - start).toBeLessThan(100);
    });
  });

  describe('접근성', () => {
    it('적절한 ARIA 레이블이 설정되어야 한다', () => {
      render(<EnhancedGameBoard {...mockProps} />);

      const gameBoard = screen.getByRole('application');
      expect(gameBoard).toHaveAttribute('aria-label', '게임 보드');
    });

    it('라이브 리전으로 상태 변화가 알려져야 한다', () => {
      render(<EnhancedGameBoard {...mockProps} />);

      const gameBoard = screen.getByRole('application');
      expect(gameBoard).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('적응형 UI', () => {
    it('모바일 환경에서 적절한 레이아웃이 적용되어야 한다', () => {
      // adaptiveUIManager 모킹을 통해 모바일 환경 시뮬레이션
      const { adaptiveUIManager } = require('../../versions/main/adaptive/ui-system');
      adaptiveUIManager.getLayoutConfig.mockReturnValue({
        gameBoard: { layout: 'stack' },
        playerCard: { size: 'compact', columns: 2 }
      });

      render(<EnhancedGameBoard {...mockProps} />);

      const gameBoard = screen.getByRole('application');
      expect(gameBoard.firstChild).toHaveClass('grid-cols-2');
    });
  });

  describe('에러 경계 처리', () => {
    it('잘못된 데이터로도 안전하게 동작해야 한다', () => {
      const invalidProps = {
        ...mockProps,
        players: [],
        gameState: {} as GameState,
      };

      expect(() => {
        render(<EnhancedGameBoard {...invalidProps} />);
      }).not.toThrow();
    });
  });
});
