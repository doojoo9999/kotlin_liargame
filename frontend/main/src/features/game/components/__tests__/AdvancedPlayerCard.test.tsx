import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {AdvancedPlayerCard} from '../components/AdvancedPlayerCard';
import {Player} from '@/shared/types/game';

// 모킹
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => children
}));

const mockPlayer: Player = {
  id: 1,
  userId: 1,
  nickname: '테스트플레이어',
  isAlive: true,
  state: 'ACTIVE',
  votesReceived: 0,
  hasVoted: false,
  hint: '빨간색 과일'
};

describe('AdvancedPlayerCard', () => {
  it('플레이어 정보를 올바르게 렌더링한다', () => {
    render(
      <AdvancedPlayerCard
        player={mockPlayer}
        gamePhase="DISCUSSION"
      />
    );

    expect(screen.getByText('테스트플레이어')).toBeInTheDocument();
  });

  it('현재 턴일 때 하이라이트를 표시한다', () => {
    render(
      <AdvancedPlayerCard
        player={mockPlayer}
        gamePhase="DISCUSSION"
        isCurrentTurn={true}
      />
    );

    expect(screen.getByText('현재 턴')).toBeInTheDocument();
  });

  it('투표 기능이 올바르게 작동한다', async () => {
    const mockOnVote = jest.fn();

    render(
      <AdvancedPlayerCard
        player={mockPlayer}
        gamePhase="VOTING"
        onVote={mockOnVote}
      />
    );

    fireEvent.click(screen.getByText('테스트플레이어'));

    await waitFor(() => {
      expect(mockOnVote).toHaveBeenCalledWith(1);
    });
  });

  it('힌트가 있을 때 힌트 표시를 렌더링한다', () => {
    render(
      <AdvancedPlayerCard
        player={mockPlayer}
        gamePhase="DISCUSSION"
      />
    );

    expect(screen.getByText('힌트 제공')).toBeInTheDocument();
  });

  it('비활성화 상태에서 클릭이 작동하지 않는다', () => {
    const mockOnVote = jest.fn();

    render(
      <AdvancedPlayerCard
        player={mockPlayer}
        gamePhase="VOTING"
        onVote={mockOnVote}
        disabled={true}
      />
    );

    fireEvent.click(screen.getByText('테스트플레이어'));

    expect(mockOnVote).not.toHaveBeenCalled();
  });

  it('제거된 플레이어는 회색으로 표시된다', () => {
    const eliminatedPlayer = { ...mockPlayer, isAlive: false };

    render(
      <AdvancedPlayerCard
        player={eliminatedPlayer}
        gamePhase="DISCUSSION"
      />
    );

    // 스타일 클래스나 속성으로 확인 가능
    const playerCard = screen.getByText('테스트플레이어').closest('div');
    expect(playerCard).toHaveStyle({ opacity: expect.stringMatching(/0\.[0-9]+/) });
  });
});
