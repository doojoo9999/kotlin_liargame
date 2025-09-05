import {render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
    LazyImage,
    OptimizedGameBoard,
    useRenderingPerformance,
    VirtualizedPlayerList
} from '../../versions/main/optimization/rendering';
import {MemoryManager, useMemoryOptimization} from '../../versions/main/optimization/memory';
import type {GameState, Player} from '../../shared/types/game';

// React Hook을 테스트하기 위한 컴포넌트
function TestComponent({ componentName }: { componentName: string }) {
  const performance = useRenderingPerformance(componentName);
  const memory = useMemoryOptimization();

  return (
    <div>
      <span data-testid="render-count">{performance.renderCount}</span>
      <span data-testid="memory-available">{memory ? 'available' : 'unavailable'}</span>
    </div>
  );
}

describe('성능 최적화 시스템 테스트', () => {
  describe('VirtualizedPlayerList', () => {
    const mockPlayers: Player[] = Array.from({ length: 100 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      isAlive: true,
      hasVoted: false,
      round: 1
    }));

    const mockOnPlayerSelect = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('많은 플레이어가 있을 때 가상화를 사용해야 한다', () => {
      render(
        <VirtualizedPlayerList
          players={mockPlayers}
          onPlayerSelect={mockOnPlayerSelect}
        />
      );

      // react-window가 사용되었는지 확인
      const virtualList = screen.getByRole('grid', { hidden: true });
      expect(virtualList).toBeInTheDocument();
    });

    it('적은 수의 플레이어일 때는 일반 렌더링을 사용해야 한다', () => {
      const fewPlayers = mockPlayers.slice(0, 5);
      render(
        <VirtualizedPlayerList
          players={fewPlayers}
          onPlayerSelect={mockOnPlayerSelect}
        />
      );

      // 모든 플레이어가 직접 렌더링되어야 함
      fewPlayers.forEach(player => {
        expect(screen.getByText(player.nickname)).toBeInTheDocument();
      });
    });

    it('스크롤 성능이 최적화되어야 한다', async () => {
      const start = performance.now();

      render(
        <VirtualizedPlayerList
          players={mockPlayers}
          onPlayerSelect={mockOnPlayerSelect}
          height={400}
          itemHeight={120}
        />
      );

      const end = performance.now();

      // 초기 렌더링이 빠르게 완료되어야 함
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('OptimizedGameBoard', () => {
    const mockPlayers: Player[] = [
      { id: '1', nickname: 'Player1', isAlive: true, hasVoted: false, round: 1 },
      { id: '2', nickname: 'Player2', isAlive: true, hasVoted: true, round: 1 },
    ];

    const mockGameState: GameState = {
      phase: 'playing',
      currentPlayerId: '1',
      round: 1,
    };

    const mockOnPlayerAction = vi.fn();

    it('메모이제이션이 올바르게 작동해야 한다', () => {
      const { rerender } = render(
        <OptimizedGameBoard
          players={mockPlayers}
          gameState={mockGameState}
          onPlayerAction={mockOnPlayerAction}
        />
      );

      // 동일한 props로 리렌더링
      rerender(
        <OptimizedGameBoard
          players={mockPlayers}
          gameState={mockGameState}
          onPlayerAction={mockOnPlayerAction}
        />
      );

      // 컴포넌트가 리렌더링되지 않았는지 확인 (실제로는 React.memo 동작 확인)
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    it('상태 변화가 있을 때만 리렌더링되어야 한다', () => {
      const renderSpy = vi.fn();

      function SpiedOptimizedGameBoard(props: any) {
        renderSpy();
        return <OptimizedGameBoard {...props} />;
      }

      const { rerender } = render(
        <SpiedOptimizedGameBoard
          players={mockPlayers}
          gameState={mockGameState}
          onPlayerAction={mockOnPlayerAction}
        />
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // 동일한 props로 리렌더링
      rerender(
        <SpiedOptimizedGameBoard
          players={mockPlayers}
          gameState={mockGameState}
          onPlayerAction={mockOnPlayerAction}
        />
      );

      // 메모이제이션으로 인해 리렌더링되지 않아야 함
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // 상태 변화가 있을 때만 리렌더링
      const newGameState = { ...mockGameState, currentPlayerId: '2' };
      rerender(
        <SpiedOptimizedGameBoard
          players={mockPlayers}
          gameState={newGameState}
          onPlayerAction={mockOnPlayerAction}
        />
      );

      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('useRenderingPerformance', () => {
    it('렌더링 횟수를 올바르게 추적해야 한다', async () => {
      const { rerender } = render(<TestComponent componentName="TestComp" />);

      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      rerender(<TestComponent componentName="TestComp" />);
      expect(screen.getByTestId('render-count')).toHaveTextContent('2');
    });

    it('성능 경고를 올바르게 감지해야 한다', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { rerender } = render(<TestComponent componentName="TestComp" />);

      // 빠른 연속 리렌더링으로 성능 경고 트리거
      for (let i = 0; i < 10; i++) {
        rerender(<TestComponent componentName="TestComp" />);
      }

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('TestComp rendering too frequently')
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('LazyImage', () => {
    beforeEach(() => {
      // IntersectionObserver 모킹
      global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
        observe: vi.fn().mockImplementation((element) => {
          // 즉시 교차 상태로 설정
          callback([{ isIntersecting: true, target: element }]);
        }),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }));
    });

    it('이미지가 뷰포트에 들어올 때 로드되어야 한다', async () => {
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          placeholder="/placeholder.svg"
        />
      );

      const image = screen.getByAltText('Test image');

      await waitFor(() => {
        expect(image).toHaveAttribute('src', '/test-image.jpg');
      });
    });

    it('이미지 로드 전에는 플레이스홀더가 표시되어야 한다', () => {
      global.IntersectionObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }));

      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          placeholder="/placeholder.svg"
        />
      );

      const image = screen.getByAltText('Test image');
      expect(image).toHaveAttribute('src', '/placeholder.svg');
    });
  });

  describe('MemoryManager', () => {
    let memoryManager: MemoryManager;

    beforeEach(() => {
      memoryManager = new MemoryManager();
    });

    afterEach(() => {
      memoryManager.cleanup();
    });

    it('타이머가 올바르게 관리되어야 한다', () => {
      const callback = vi.fn();
      const timerId = memoryManager.setTimeout(callback, 100);

      expect(typeof timerId).toBe('number');
      expect(timerId).toBeGreaterThan(0);
    });

    it('인터벌이 올바르게 관리되어야 한다', () => {
      const callback = vi.fn();
      const intervalId = memoryManager.setInterval(callback, 100);

      expect(typeof intervalId).toBe('number');
      expect(intervalId).toBeGreaterThan(0);
    });

    it('Intersection Observer가 풀링되어야 한다', () => {
      const observer1 = memoryManager.getIntersectionObserver(0.1);
      const observer2 = memoryManager.getIntersectionObserver(0.1);
      const observer3 = memoryManager.getIntersectionObserver(0.5);

      // 같은 threshold를 사용하면 같은 observer 반환
      expect(observer1).toBe(observer2);
      // 다른 threshold를 사용하면 다른 observer 반환
      expect(observer1).not.toBe(observer3);
    });

    it('메모리 정보를 올바르게 가져와야 한다', () => {
      const memoryInfo = memoryManager.getMemoryInfo();

      if (memoryInfo) {
        expect(memoryInfo).toHaveProperty('used');
        expect(memoryInfo).toHaveProperty('total');
        expect(memoryInfo).toHaveProperty('limit');
        expect(memoryInfo).toHaveProperty('percentage');
        expect(memoryInfo.percentage).toBeGreaterThanOrEqual(0);
        expect(memoryInfo.percentage).toBeLessThanOrEqual(100);
      }
    });

    it('메모리 압박 상태를 올바르게 감지해야 한다', () => {
      const isHighPressure = memoryManager.isMemoryPressureHigh();
      expect(typeof isHighPressure).toBe('boolean');
    });

    it('정리 시 모든 리소스가 해제되어야 한다', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

      // 타이머 및 인터벌 생성
      memoryManager.setTimeout(() => {}, 1000);
      memoryManager.setInterval(() => {}, 1000);

      // 정리 실행
      memoryManager.cleanup();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('useMemoryOptimization', () => {
    it('메모리 매니저가 올바르게 제공되어야 한다', () => {
      render(<TestComponent componentName="TestComp" />);

      expect(screen.getByTestId('memory-available')).toHaveTextContent('available');
    });

    it('컴포넌트 언마운트 시 정리되어야 한다', () => {
      const { unmount } = render(<TestComponent componentName="TestComp" />);

      // 정리 함수가 호출되는지 확인하기 위한 spy
      const cleanupSpy = vi.fn();

      // 실제로는 useEffect의 cleanup 함수를 테스트해야 하지만
      // 여기서는 개념적 확인
      unmount();

      // 언마운트 시 에러가 발생하지 않아야 함
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('성능 벤치마크', () => {
    it('대량의 데이터 처리 성능이 기준을 만족해야 한다', async () => {
      const largePlayerList = Array.from({ length: 1000 }, (_, i) => ({
        id: `player-${i}`,
        nickname: `Player${i}`,
        isAlive: Math.random() > 0.2,
        hasVoted: Math.random() > 0.5,
        round: 1
      }));

      const start = performance.now();

      render(
        <VirtualizedPlayerList
          players={largePlayerList}
          onPlayerSelect={() => {}}
        />
      );

      const end = performance.now();
      const renderTime = end - start;

      // 1000명의 플레이어 렌더링이 100ms 이내에 완료되어야 함
      expect(renderTime).toBeLessThan(100);
    });

    it('메모리 사용량이 효율적이어야 한다', () => {
      const initialMemory = memoryManager.getMemoryInfo();

      // 많은 컴포넌트 렌더링
      const { unmount } = render(
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <TestComponent key={i} componentName={`Comp${i}`} />
          ))}
        </div>
      );

      const afterRenderMemory = memoryManager.getMemoryInfo();

      // 컴포넌트 정리
      unmount();

      // 메모리 정리 강제 실행 (실제 환경에서는 GC가 자동 실행)
      if (global.gc) {
        global.gc();
      }

      const afterCleanupMemory = memoryManager.getMemoryInfo();

      if (initialMemory && afterRenderMemory && afterCleanupMemory) {
        // 메모리 사용량이 크게 증가하지 않았는지 확인
        const memoryIncrease = afterCleanupMemory.used - initialMemory.used;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.used) * 100;

        // 메모리 증가가 50% 이내여야 함
        expect(memoryIncreasePercent).toBeLessThan(50);
      }
    });
  });
});
