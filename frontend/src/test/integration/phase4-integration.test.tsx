import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Phase4Demo} from '../../main-phase4-demo';

// 모든 모듈 모킹
vi.mock('../../shared/interactions/manager', () => ({
  interactionManager: {
    executeInteraction: vi.fn(() => Promise.resolve()),
    setSoundEnabled: vi.fn(),
    setHapticsEnabled: vi.fn(),
  },
}));

vi.mock('../../versions/main/adaptive/ui-system', () => ({
  adaptiveUIManager: {
    getLayoutConfig: () => ({
      playerCard: { size: 'full', columns: 4, spacing: 'comfortable', orientation: 'horizontal' },
      gameBoard: { layout: 'grid', orientation: 'landscape', padding: '2rem' },
      chat: { position: 'side', height: '100%', width: '300px' },
      navigation: { type: 'top', collapsible: false }
    }),
    getAnimationLevel: () => 'full',
    getDynamicStyles: () => ({ fontSize: '16px', colorScheme: 'light', spacing: 'comfortable' }),
    shouldUseAdvancedFeatures: () => true,
  },
}));

vi.mock('../../versions/main/accessibility/screen-reader', () => ({
  screenReaderManager: {
    announceGameEvent: vi.fn(),
    announcePlayerTurn: vi.fn(),
    announceVotingPhase: vi.fn(),
    announceGameResult: vi.fn(),
  },
  AriaLiveRegion: () => (
    <>
      <div id="aria-live-polite" aria-live="polite" className="sr-only" />
      <div id="aria-live-assertive" aria-live="assertive" className="sr-only" />
    </>
  ),
}));

describe('Phase 4 통합 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // DOM 요소 모킹
    Object.defineProperty(document, 'getElementById', {
      value: (id: string) => {
        if (id === 'aria-live-polite' || id === 'aria-live-assertive') {
          return {
            textContent: '',
            setAttribute: vi.fn(),
            removeAttribute: vi.fn(),
          };
        }
        return null;
      },
    });
  });

  describe('전체 애플리케이션 통합', () => {
    it('Phase 4 데모가 오류 없이 렌더링되어야 한다', async () => {
      render(<Phase4Demo />);

      await waitFor(() => {
        expect(screen.getByText('🚀 Phase 4: 고급 기능 데모')).toBeInTheDocument();
      });

      expect(screen.getByText('마이크로 인터랙션, 고급 애니메이션, 접근성, 성능 최적화')).toBeInTheDocument();
    });

    it('모든 주요 섹션이 렌더링되어야 한다', async () => {
      render(<Phase4Demo />);

      await waitFor(() => {
        // 헤더
        expect(screen.getByRole('banner')).toBeInTheDocument();

        // 제스처 영역
        expect(screen.getByText(/제스처 테스트 영역/)).toBeInTheDocument();

        // 탭 시스템
        expect(screen.getByRole('tablist')).toBeInTheDocument();

        // 게임 보드
        expect(screen.getByText('통합 게임 보드')).toBeInTheDocument();
      });
    });
  });

  describe('탭 시스템 통합 테스트', () => {
    it('탭 전환이 올바르게 작동해야 한다', async () => {
      const user = userEvent.setup();
      render(<Phase4Demo />);

      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });

      // 초기 탭 확인
      const interactionsTab = screen.getByRole('tab', { name: '마이크로 인터랙션' });
      expect(interactionsTab).toHaveAttribute('aria-selected', 'true');

      // 다른 탭으로 전환
      const animationsTab = screen.getByRole('tab', { name: '고급 애니메이션' });
      await user.click(animationsTab);

      expect(animationsTab).toHaveAttribute('aria-selected', 'true');
      expect(interactionsTab).toHaveAttribute('aria-selected', 'false');
    });

    it('키보드로 탭 네비게이션이 가능해야 한다', async () => {
      const user = userEvent.setup();
      render(<Phase4Demo />);

      await waitFor(() => {
        const tablist = screen.getByRole('tablist');
        expect(tablist).toBeInTheDocument();
      });

      const firstTab = screen.getByRole('tab', { name: '마이크로 인터랙션' });
      firstTab.focus();

      await user.keyboard('{ArrowRight}');

      const secondTab = screen.getByRole('tab', { name: '고급 애니메이션' });
      expect(secondTab).toHaveFocus();
    });
  });

  describe('게임 보드 통합 테스트', () => {
    it('플레이어 카드들이 올바르게 렌더링되어야 한다', async () => {
      render(<Phase4Demo />);

      await waitFor(() => {
        expect(screen.getByText('플레이어1')).toBeInTheDocument();
        expect(screen.getByText('플레이어2')).toBeInTheDocument();
        expect(screen.getByText('라이어')).toBeInTheDocument();
      });
    });

    it('플레이어 선택이 전체 시스템에서 작동해야 한다', async () => {
      const user = userEvent.setup();
      render(<Phase4Demo />);

      await waitFor(() => {
        const player1Card = screen.getByLabelText(/플레이어 플레이어1/);
        expect(player1Card).toBeInTheDocument();
      });

      const player1Card = screen.getByLabelText(/플레이어 플레이어1/);
      await user.click(player1Card);

      // 상태 변화 확인 (선택된 플레이어 하이라이트)
      expect(player1Card).toHaveAttribute('aria-selected', 'true');
    });

    it('게임 상태 전환이 올바르게 작동해야 한다', async () => {
      const user = userEvent.setup();
      render(<Phase4Demo />);

      await waitFor(() => {
        expect(screen.getByText('Player1님의 차례')).toBeInTheDocument();
      });

      // 투표 시작 버튼 클릭
      const voteButton = screen.getByRole('button', { name: '투표 시작' });
      await user.click(voteButton);

      await waitFor(() => {
        expect(screen.getByText('투표 시간')).toBeInTheDocument();
      });
    });
  });

  describe('제스처 시스템 통합', () => {
    it('제스처 영역에서 터치 이벤트가 감지되어야 한다', async () => {
      render(<Phase4Demo />);

      await waitFor(() => {
        const gestureArea = screen.getByText(/제스처 테스트 영역/).closest('div');
        expect(gestureArea).toBeInTheDocument();
      });

      const gestureArea = screen.getByText(/제스처 테스트 영역/).closest('div');

      // 터치 시작
      fireEvent.touchStart(gestureArea!, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      // 터치 상태 확인
      await waitFor(() => {
        expect(screen.getByText('터치 감지됨!')).toBeInTheDocument();
      });
    });

    it('스와이프 제스처로 탭 변경이 가능해야 한다', async () => {
      render(<Phase4Demo />);

      await waitFor(() => {
        const gestureArea = screen.getByText(/제스처 테스트 영역/).closest('div');
        expect(gestureArea).toBeInTheDocument();
      });

      const gestureArea = screen.getByText(/제스처 테스트 영역/).closest('div');

      // 왼쪽 스와이프 시뮬레이션
      fireEvent.touchStart(gestureArea!, {
        touches: [{ clientX: 200, clientY: 100 }]
      });

      fireEvent.touchMove(gestureArea!, {
        touches: [{ clientX: 50, clientY: 100 }]
      });

      fireEvent.touchEnd(gestureArea!);

      // 스크린 리더 알림 확인
      const { screenReaderManager } = require('../../versions/main/accessibility/screen-reader');
      await waitFor(() => {
        expect(screenReaderManager.announceGameEvent).toHaveBeenCalledWith(
          expect.stringContaining('스와이프')
        );
      });
    });
  });

  describe('접근성 통합 테스트', () => {
    it('스크린 리더 알림이 올바르게 작동해야 한다', async () => {
      render(<Phase4Demo />);

      const { screenReaderManager } = require('../../versions/main/accessibility/screen-reader');

      await waitFor(() => {
        expect(screenReaderManager.announceGameEvent).toHaveBeenCalledWith(
          'Phase 4 고급 기능 데모가 로드되었습니다',
          'high'
        );
      });
    });

    it('aria-live 영역이 존재해야 한다', async () => {
      render(<Phase4Demo />);

      await waitFor(() => {
        expect(document.getElementById('aria-live-polite')).toBeTruthy();
        expect(document.getElementById('aria-live-assertive')).toBeTruthy();
      });
    });

    it('키보드 네비게이션이 전역적으로 작동해야 한다', async () => {
      const user = userEvent.setup();
      render(<Phase4Demo />);

      await waitFor(() => {
        const mainContent = screen.getByRole('main') || document.body.firstElementChild;
        expect(mainContent).toBeInTheDocument();
      });

      // Tab 키로 포커스 이동
      await user.tab();

      // 포커스 가능한 요소가 포커스를 받았는지 확인
      const focusedElement = document.activeElement;
      expect(focusedElement).not.toBe(document.body);
    });
  });

  describe('성능 통합 테스트', () => {
    it('성능 정보가 올바르게 표시되어야 한다', async () => {
      render(<Phase4Demo />);

      await waitFor(() => {
        expect(screen.getByText(/렌더링 횟수:/)).toBeInTheDocument();
        expect(screen.getByText(/화면 크기:/)).toBeInTheDocument();
        expect(screen.getByText(/애니메이션:/)).toBeInTheDocument();
      });
    });

    it('대량 데이터 처리 시에도 반응성을 유지해야 한다', async () => {
      const start = performance.now();

      render(<Phase4Demo />);

      await waitFor(() => {
        expect(screen.getByText('통합 게임 보드')).toBeInTheDocument();
      });

      const end = performance.now();
      const renderTime = end - start;

      // 초기 렌더링이 1초 이내에 완료되어야 함
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('모달 통합 테스트', () => {
    it('플레이어 추가 모달이 올바르게 작동해야 한다', async () => {
      const user = userEvent.setup();
      render(<Phase4Demo />);

      await waitFor(() => {
        const addPlayerButton = screen.getByRole('button', { name: '플레이어 추가' });
        expect(addPlayerButton).toBeInTheDocument();
      });

      const addPlayerButton = screen.getByRole('button', { name: '플레이어 추가' });
      await user.click(addPlayerButton);

      // 모달이 열렸는지 확인
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('플레이어 추가')).toBeInTheDocument();
      });

      // 입력 필드에 이름 입력
      const nameInput = screen.getByLabelText('플레이어 이름');
      await user.type(nameInput, '새플레이어');

      // 추가 버튼 클릭
      const submitButton = screen.getByRole('button', { name: '추가' });
      await user.click(submitButton);

      // 모달이 닫히고 새 플레이어가 추가되었는지 확인
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.getByText('새플레이어')).toBeInTheDocument();
      });
    });

    it('모달 키보드 네비게이션이 작동해야 한다', async () => {
      const user = userEvent.setup();
      render(<Phase4Demo />);

      // 모달 열기
      const addPlayerButton = screen.getByRole('button', { name: '플레이어 추가' });
      await user.click(addPlayerButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // ESC 키로 모달 닫기
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('전체 워크플로우 테스트', () => {
    it('완전한 게임 시나리오가 작동해야 한다', async () => {
      const user = userEvent.setup();
      render(<Phase4Demo />);

      // 1. 초기 상태 확인
      await waitFor(() => {
        expect(screen.getByText('Player1님의 차례')).toBeInTheDocument();
      });

      // 2. 플레이어 선택
      const player2Card = screen.getByLabelText(/플레이어 플레이어2/);
      await user.click(player2Card);

      // 3. 투표 단계로 전환
      const voteButton = screen.getByRole('button', { name: '투표 시작' });
      await user.click(voteButton);

      await waitFor(() => {
        expect(screen.getByText('투표 시간')).toBeInTheDocument();
      });

      // 4. 플레이어에게 투표
      await user.dblClick(player2Card);

      // 5. 스크린 리더 알림 확인
      const { screenReaderManager } = require('../../versions/main/accessibility/screen-reader');
      expect(screenReaderManager.announceGameEvent).toHaveBeenCalledWith(
        expect.stringContaining('투표')
      );

      // 6. 게임 재개
      const resumeButton = screen.getByRole('button', { name: '게임 재개' });
      await user.click(resumeButton);

      await waitFor(() => {
        expect(screen.getByText('Player1님의 차례')).toBeInTheDocument();
      });
    });
  });

  describe('에러 처리 및 복구', () => {
    it('네트워크 오류 시에도 안정적으로 작동해야 한다', async () => {
      // 네트워크 오류 시뮬레이션
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      expect(() => {
        render(<Phase4Demo />);
      }).not.toThrow();

      await waitFor(() => {
        expect(screen.getByText('🚀 Phase 4: 고급 기능 데모')).toBeInTheDocument();
      });

      global.fetch = originalFetch;
    });

    it('JavaScript 오류 시에도 기본 기능은 작동해야 한다', async () => {
      // 콘솔 에러 임시 숨기기
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // 강제로 에러 발생
      const originalAnimate = Element.prototype.animate;
      Element.prototype.animate = vi.fn().mockImplementation(() => {
        throw new Error('Animation error');
      });

      render(<Phase4Demo />);

      // 기본 렌더링은 여전히 작동해야 함
      await waitFor(() => {
        expect(screen.getByText('🚀 Phase 4: 고급 기능 데모')).toBeInTheDocument();
      });

      Element.prototype.animate = originalAnimate;
      consoleSpy.mockRestore();
    });
  });
});
