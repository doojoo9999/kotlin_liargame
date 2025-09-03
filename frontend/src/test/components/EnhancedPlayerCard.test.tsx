import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {EnhancedPlayerCard} from '../../versions/main/components/enhanced/EnhancedPlayerCard';
import type {Player} from '../../shared/types/game';

// 모킹
vi.mock('../../shared/interactions/manager', () => ({
  interactionManager: {
    executeInteraction: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../../versions/main/adaptive/ui-system', () => ({
  adaptiveUIManager: {
    getLayoutConfig: () => ({
      playerCard: {
        size: 'full',
        columns: 4,
        spacing: 'comfortable',
        orientation: 'horizontal'
      }
    }),
    getAnimationLevel: () => 'full',
  },
}));

vi.mock('../../versions/main/accessibility/screen-reader', () => ({
  screenReaderManager: {
    announceGameEvent: vi.fn(),
  },
}));

describe('EnhancedPlayerCard', () => {
  const mockPlayer: Player = {
    id: '1',
    nickname: 'TestPlayer',
    isAlive: true,
    hasVoted: false,
    hint: 'Test hint',
    role: 'citizen',
    round: 1
  };

  const mockProps = {
    player: mockPlayer,
    onSelect: vi.fn(),
    onVote: vi.fn(),
    onContextMenu: vi.fn(),
    isSelected: false,
    isCurrentTurn: false,
    canVote: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('플레이어 정보가 올바르게 렌더링되어야 한다', () => {
      render(<EnhancedPlayerCard {...mockProps} />);

      expect(screen.getByText('TestPlayer')).toBeInTheDocument();
      expect(screen.getByText('T')).toBeInTheDocument(); // 아바타 이니셜
      expect(screen.getByText('생존')).toBeInTheDocument();
    });

    it('힌트가 있으면 표시되어야 한다', () => {
      render(<EnhancedPlayerCard {...mockProps} />);

      expect(screen.getByText('"Test hint"')).toBeInTheDocument();
    });

    it('탈락한 플레이어는 시각적으로 구분되어야 한다', () => {
      const deadPlayer = { ...mockPlayer, isAlive: false };
      render(<EnhancedPlayerCard {...mockProps} player={deadPlayer} />);

      expect(screen.getByText('탈락')).toBeInTheDocument();

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveClass('opacity-60', 'grayscale');
    });
  });

  describe('상태별 스타일링', () => {
    it('선택된 상태일 때 하이라이트 스타일이 적용되어야 한다', () => {
      render(<EnhancedPlayerCard {...mockProps} isSelected={true} />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveClass('border-blue-500', 'bg-blue-50');
      expect(cardElement).toHaveAttribute('aria-selected', 'true');
    });

    it('현재 턴일 때 특별한 스타일이 적용되어야 한다', () => {
      render(<EnhancedPlayerCard {...mockProps} isCurrentTurn={true} />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveClass('border-yellow-400', 'bg-yellow-50');
      expect(cardElement).toHaveAttribute('aria-current', 'true');
    });

    it('투표 가능한 상태일 때 시각적 표시가 있어야 한다', () => {
      render(<EnhancedPlayerCard {...mockProps} canVote={true} />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveClass('ring-2', 'ring-green-400');
    });
  });

  describe('인터랙션 테스트', () => {
    it('클릭 시 onSelect 콜백이 호출되어야 한다', async () => {
      const user = userEvent.setup();
      render(<EnhancedPlayerCard {...mockProps} />);

      const cardElement = screen.getByRole('button');
      await user.click(cardElement);

      expect(mockProps.onSelect).toHaveBeenCalledWith(mockPlayer);
    });

    it('더블클릭 시 투표 가능하면 onVote 콜백이 호출되어야 한다', async () => {
      const user = userEvent.setup();
      render(<EnhancedPlayerCard {...mockProps} canVote={true} />);

      const cardElement = screen.getByRole('button');
      await user.dblClick(cardElement);

      expect(mockProps.onVote).toHaveBeenCalledWith(mockPlayer);
    });

    it('컨텍스트 메뉴 이벤트가 처리되어야 한다', async () => {
      render(<EnhancedPlayerCard {...mockProps} />);

      const cardElement = screen.getByRole('button');
      fireEvent.contextMenu(cardElement);

      expect(mockProps.onContextMenu).toHaveBeenCalledWith(mockPlayer);
    });
  });

  describe('키보드 접근성', () => {
    it('키보드로 포커스 가능해야 한다', () => {
      render(<EnhancedPlayerCard {...mockProps} />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveAttribute('tabIndex', '0');
    });

    it('Enter 키로 선택할 수 있어야 한다', async () => {
      const user = userEvent.setup();
      render(<EnhancedPlayerCard {...mockProps} />);

      const cardElement = screen.getByRole('button');
      cardElement.focus();
      await user.keyboard('{Enter}');

      expect(mockProps.onSelect).toHaveBeenCalledWith(mockPlayer);
    });

    it('Space 키로 선택할 수 있어야 한다', async () => {
      const user = userEvent.setup();
      render(<EnhancedPlayerCard {...mockProps} />);

      const cardElement = screen.getByRole('button');
      cardElement.focus();
      await user.keyboard(' ');

      expect(mockProps.onSelect).toHaveBeenCalledWith(mockPlayer);
    });

    it('V 키로 투표할 수 있어야 한다', async () => {
      const user = userEvent.setup();
      render(<EnhancedPlayerCard {...mockProps} canVote={true} />);

      const cardElement = screen.getByRole('button');
      cardElement.focus();
      await user.keyboard('v');

      expect(mockProps.onVote).toHaveBeenCalledWith(mockPlayer);
    });
  });

  describe('접근성 속성', () => {
    it('적절한 aria-label이 설정되어야 한다', () => {
      render(<EnhancedPlayerCard {...mockProps} />);

      const cardElement = screen.getByRole('button');
      const ariaLabel = cardElement.getAttribute('aria-label');

      expect(ariaLabel).toContain('플레이어 TestPlayer');
      expect(ariaLabel).toContain('생존');
      expect(ariaLabel).toContain('투표 대기');
      expect(ariaLabel).toContain('힌트: Test hint');
    });

    it('현재 턴일 때 aria-current가 설정되어야 한다', () => {
      render(<EnhancedPlayerCard {...mockProps} isCurrentTurn={true} />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveAttribute('aria-current', 'true');
    });

    it('선택 상태가 aria-selected로 표현되어야 한다', () => {
      render(<EnhancedPlayerCard {...mockProps} isSelected={true} />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('애니메이션 통합', () => {
    it('현재 턴 변경 시 애니메이션이 실행되어야 한다', async () => {
      const { rerender } = render(<EnhancedPlayerCard {...mockProps} />);

      // 현재 턴으로 변경
      rerender(<EnhancedPlayerCard {...mockProps} isCurrentTurn={true} />);

      await waitFor(() => {
        const { interactionManager } = require('../../shared/interactions/manager');
        expect(interactionManager.executeInteraction).toHaveBeenCalled();
      });
    });
  });

  describe('에러 처리', () => {
    it('필수 props가 없어도 크래시되지 않아야 한다', () => {
      const minimalProps = { player: mockPlayer };

      expect(() => {
        render(<EnhancedPlayerCard {...minimalProps} />);
      }).not.toThrow();
    });

    it('잘못된 플레이어 데이터로도 안전하게 렌더링되어야 한다', () => {
      const invalidPlayer = {
        ...mockPlayer,
        nickname: '',
        id: undefined as any,
      };

      expect(() => {
        render(<EnhancedPlayerCard {...mockProps} player={invalidPlayer} />);
      }).not.toThrow();
    });
  });
});
