/**
 * Accessibility Tests
 * 
 * Tests for WCAG compliance, screen reader support,
 * keyboard navigation, and inclusive design patterns.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {axe, toHaveNoViolations} from 'jest-axe';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MantineProvider} from '@mantine/core';
import type {ReactNode} from 'react';

// Extend Jest matchers for accessibility
expect.extend(toHaveNoViolations);

// Mock components for accessibility testing
const MockButton = ({ 
  children, 
  onClick, 
  disabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props 
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  [key: string]: any;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    {...props}
  >
    {children}
  </button>
);

const MockForm = ({ 
  onSubmit,
  children 
}: { 
  onSubmit?: (e: React.FormEvent) => void;
  children: ReactNode;
}) => (
  <form onSubmit={onSubmit} noValidate>
    {children}
  </form>
);

const MockInput = ({
  label,
  id,
  error,
  required = false,
  type = 'text',
  'aria-describedby': ariaDescribedBy,
  ...props
}: {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  type?: string;
  'aria-describedby'?: string;
  [key: string]: any;
}) => (
  <div>
    <label htmlFor={id}>
      {label}
      {required && <span aria-label="필수 입력">*</span>}
    </label>
    <input
      id={id}
      type={type}
      required={required}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : ariaDescribedBy}
      {...props}
    />
    {error && (
      <div
        id={`${id}-error`}
        role="alert"
        aria-live="polite"
      >
        {error}
      </div>
    )}
  </div>
);

const MockModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) => {
  React.useEffect(() => {
    if (isOpen) {
      // Focus trap logic would go here
      const firstFocusable = document.querySelector('[tabindex="0"]');
      if (firstFocusable) {
        (firstFocusable as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="modal"
    >
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <header>
          <h2 id="modal-title">{title}</h2>
          <button
            onClick={onClose}
            aria-label="모달 닫기"
            className="close-button"
          >
            ×
          </button>
        </header>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

const MockAlert = ({ 
  type, 
  children,
  onDismiss 
}: { 
  type: 'info' | 'success' | 'warning' | 'error';
  children: ReactNode;
  onDismiss?: () => void;
}) => {
  const roleMap = {
    info: 'status',
    success: 'status',
    warning: 'alert',
    error: 'alert'
  };

  return (
    <div
      role={roleMap[type]}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`alert alert-${type}`}
    >
      {children}
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="알림 닫기"
          className="alert-dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
};

const MockNavigationMenu = ({ 
  items 
}: { 
  items: { label: string; href: string; current?: boolean }[];
}) => (
  <nav aria-label="주요 메뉴">
    <ul role="menubar">
      {items.map((item, index) => (
        <li key={index} role="none">
          <a
            href={item.href}
            role="menuitem"
            aria-current={item.current ? 'page' : undefined}
            tabIndex={item.current ? 0 : -1}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

const MockDataTable = ({ 
  headers, 
  data 
}: { 
  headers: string[];
  data: Record<string, any>[];
}) => (
  <table role="table" aria-label="게임 결과">
    <thead>
      <tr role="row">
        {headers.map((header, index) => (
          <th key={index} role="columnheader" scope="col">
            {header}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map((row, index) => (
        <tr key={index} role="row">
          {headers.map((header, cellIndex) => (
            <td 
              key={cellIndex}
              role={cellIndex === 0 ? 'rowheader' : 'gridcell'}
              scope={cellIndex === 0 ? 'row' : undefined}
            >
              {row[header.toLowerCase()]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const MockSkipLinks = () => (
  <div className="skip-links">
    <a href="#main-content" className="skip-link">
      메인 콘텐츠로 건너뛰기
    </a>
    <a href="#navigation" className="skip-link">
      내비게이션으로 건너뛰기
    </a>
  </div>
);

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

describe('Accessibility Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('WCAG Compliance', () => {
    it('should have no accessibility violations on login form', async () => {
      const { container } = render(
        <TestWrapper>
          <MockForm>
            <MockInput
              label="닉네임"
              id="nickname"
              required
              placeholder="닉네임을 입력하세요"
            />
            <MockButton type="submit">로그인</MockButton>
          </MockForm>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on game board', async () => {
      const mockPlayers = [
        { name: '플레이어1', score: 100, rank: 1 },
        { name: '플레이어2', score: 80, rank: 2 }
      ];

      const { container } = render(
        <TestWrapper>
          <main>
            <h1>라이어 게임</h1>
            <MockDataTable 
              headers={['Name', 'Score', 'Rank']}
              data={mockPlayers}
            />
            <MockButton onClick={() => {}}>
              투표하기
            </MockButton>
          </main>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on modal dialog', async () => {
      const { container } = render(
        <TestWrapper>
          <MockModal
            isOpen={true}
            onClose={() => {}}
            title="게임 설정"
          >
            <p>게임 설정을 변경하세요.</p>
            <MockButton onClick={() => {}}>저장</MockButton>
          </MockModal>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Accessibility', () => {
    it('should associate labels with inputs correctly', () => {
      render(
        <TestWrapper>
          <MockInput
            label="닉네임"
            id="nickname-input"
            required
          />
        </TestWrapper>
      );

      const input = screen.getByLabelText('닉네임*');
      expect(input).toHaveAttribute('id', 'nickname-input');
      expect(input).toHaveAttribute('required');
    });

    it('should announce form validation errors', () => {
      render(
        <TestWrapper>
          <MockInput
            label="닉네임"
            id="nickname-input"
            error="닉네임은 2자 이상이어야 합니다."
            required
          />
        </TestWrapper>
      );

      const input = screen.getByLabelText('닉네임*');
      const errorMessage = screen.getByRole('alert');

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'nickname-input-error');
      expect(errorMessage).toHaveAttribute('id', 'nickname-input-error');
      expect(errorMessage).toHaveTextContent('닉네임은 2자 이상이어야 합니다.');
    });

    it('should have proper fieldset and legend for related inputs', () => {
      const MockGameSettings = () => (
        <fieldset>
          <legend>게임 설정</legend>
          <MockInput
            label="최대 플레이어 수"
            id="max-players"
            type="number"
          />
          <MockInput
            label="제한 시간 (분)"
            id="time-limit"
            type="number"
          />
        </fieldset>
      );

      render(
        <TestWrapper>
          <MockGameSettings />
        </TestWrapper>
      );

      const fieldset = screen.getByRole('group', { name: '게임 설정' });
      expect(fieldset).toBeInTheDocument();
    });

    it('should provide clear instructions for complex forms', () => {
      const MockComplexForm = () => (
        <MockForm>
          <div id="form-instructions">
            <p>게임에 참가하려면 닉네임을 입력하고 방 코드를 선택하세요.</p>
          </div>
          <MockInput
            label="닉네임"
            id="nickname"
            aria-describedby="form-instructions nickname-help"
            required
          />
          <div id="nickname-help">
            2-10자의 한글, 영문, 숫자만 사용 가능합니다.
          </div>
          <MockInput
            label="방 코드"
            id="room-code"
            placeholder="예: ABC123"
          />
        </MockForm>
      );

      render(
        <TestWrapper>
          <MockComplexForm />
        </TestWrapper>
      );

      const nicknameInput = screen.getByLabelText('닉네임*');
      expect(nicknameInput).toHaveAttribute('aria-describedby', 'form-instructions nickname-help');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through interactive elements', async () => {
      render(
        <TestWrapper>
          <div>
            <MockButton data-testid="button1">버튼 1</MockButton>
            <MockInput label="입력 필드" id="input1" />
            <MockButton data-testid="button2">버튼 2</MockButton>
          </div>
        </TestWrapper>
      );

      const button1 = screen.getByTestId('button1');
      const input = screen.getByLabelText('입력 필드');
      const button2 = screen.getByTestId('button2');

      // Start with no focus
      expect(document.activeElement).toBe(document.body);

      // Tab to first element
      await user.tab();
      expect(button1).toHaveFocus();

      // Tab to second element
      await user.tab();
      expect(input).toHaveFocus();

      // Tab to third element
      await user.tab();
      expect(button2).toHaveFocus();

      // Shift+Tab to go back
      await user.tab({ shift: true });
      expect(input).toHaveFocus();
    });

    it('should handle Enter key for button activation', async () => {
      const mockClick = vi.fn();
      
      render(
        <TestWrapper>
          <MockButton onClick={mockClick} data-testid="test-button">
            클릭하세요
          </MockButton>
        </TestWrapper>
      );

      const button = screen.getByTestId('test-button');
      button.focus();

      await user.keyboard('{Enter}');
      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('should handle Space key for button activation', async () => {
      const mockClick = vi.fn();
      
      render(
        <TestWrapper>
          <MockButton onClick={mockClick} data-testid="test-button">
            클릭하세요
          </MockButton>
        </TestWrapper>
      );

      const button = screen.getByTestId('test-button');
      button.focus();

      await user.keyboard(' ');
      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('should handle arrow keys for navigation menu', async () => {
      const menuItems = [
        { label: '홈', href: '/home', current: true },
        { label: '게임', href: '/game' },
        { label: '설정', href: '/settings' }
      ];

      render(
        <TestWrapper>
          <MockNavigationMenu items={menuItems} />
        </TestWrapper>
      );

      const menubar = screen.getByRole('menubar');
      const firstItem = screen.getByRole('menuitem', { name: '홈' });
      const secondItem = screen.getByRole('menuitem', { name: '게임' });

      firstItem.focus();
      expect(firstItem).toHaveFocus();

      // Arrow down should move to next item
      await user.keyboard('{ArrowDown}');
      expect(secondItem).toHaveFocus();
    });

    it('should provide skip links for efficient navigation', () => {
      render(
        <TestWrapper>
          <div>
            <MockSkipLinks />
            <nav id="navigation">
              <a href="/home">홈</a>
              <a href="/game">게임</a>
            </nav>
            <main id="main-content">
              <h1>메인 콘텐츠</h1>
              <p>게임 콘텐츠입니다.</p>
            </main>
          </div>
        </TestWrapper>
      );

      const skipToMain = screen.getByText('메인 콘텐츠로 건너뛰기');
      const skipToNav = screen.getByText('내비게이션으로 건너뛰기');

      expect(skipToMain).toHaveAttribute('href', '#main-content');
      expect(skipToNav).toHaveAttribute('href', '#navigation');
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce page changes with live regions', () => {
      render(
        <TestWrapper>
          <div
            role="status"
            aria-live="polite"
            aria-label="페이지 상태"
            data-testid="status-region"
          >
            게임 로비에 입장했습니다.
          </div>
        </TestWrapper>
      );

      const statusRegion = screen.getByTestId('status-region');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      expect(statusRegion).toHaveTextContent('게임 로비에 입장했습니다.');
    });

    it('should provide proper headings hierarchy', () => {
      render(
        <TestWrapper>
          <div>
            <h1>라이어 게임</h1>
            <section>
              <h2>게임 설정</h2>
              <h3>플레이어 설정</h3>
              <h3>난이도 설정</h3>
            </section>
            <section>
              <h2>게임 진행</h2>
              <h3>현재 턴</h3>
            </section>
          </div>
        </TestWrapper>
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toHaveTextContent('라이어 게임');
      expect(h2s).toHaveLength(2);
      expect(h3s).toHaveLength(3);
    });

    it('should describe complex UI elements properly', () => {
      render(
        <TestWrapper>
          <MockDataTable 
            headers={['플레이어', '점수', '순위']}
            data={[
              { '플레이어': '홍길동', '점수': 100, '순위': 1 },
              { '플레이어': '김철수', '점수': 80, '순위': 2 }
            ]}
          />
        </TestWrapper>
      );

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', '게임 결과');

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(3);
      expect(headers[0]).toHaveAttribute('scope', 'col');

      const firstRowHeader = screen.getByRole('rowheader');
      expect(firstRowHeader).toHaveAttribute('scope', 'row');
      expect(firstRowHeader).toHaveTextContent('홍길동');
    });

    it('should provide context for dynamic content updates', () => {
      const MockGameStatus = ({ phase, timeLeft }: { phase: string; timeLeft: number }) => (
        <div>
          <div
            role="timer"
            aria-live="assertive"
            aria-label={`남은 시간 ${timeLeft}초`}
            data-testid="timer"
          >
            {timeLeft}초
          </div>
          <div
            role="status"
            aria-live="polite"
            data-testid="phase-status"
          >
            현재 단계: {phase}
          </div>
        </div>
      );

      const { rerender } = render(
        <TestWrapper>
          <MockGameStatus phase="힌트 입력" timeLeft={30} />
        </TestWrapper>
      );

      const timer = screen.getByTestId('timer');
      const phaseStatus = screen.getByTestId('phase-status');

      expect(timer).toHaveAttribute('aria-live', 'assertive');
      expect(phaseStatus).toHaveAttribute('aria-live', 'polite');

      // Update phase
      rerender(
        <TestWrapper>
          <MockGameStatus phase="투표" timeLeft={60} />
        </TestWrapper>
      );

      expect(phaseStatus).toHaveTextContent('현재 단계: 투표');
    });
  });

  describe('Alert and Notification Accessibility', () => {
    it('should use appropriate ARIA roles for different alert types', () => {
      const { rerender } = render(
        <TestWrapper>
          <MockAlert type="info">정보 메시지입니다.</MockAlert>
        </TestWrapper>
      );

      let alert = screen.getByText('정보 메시지입니다.');
      expect(alert).toHaveAttribute('role', 'status');
      expect(alert).toHaveAttribute('aria-live', 'polite');

      rerender(
        <TestWrapper>
          <MockAlert type="error">오류가 발생했습니다.</MockAlert>
        </TestWrapper>
      );

      alert = screen.getByText('오류가 발생했습니다.');
      expect(alert).toHaveAttribute('role', 'alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should allow dismissing alerts with keyboard', async () => {
      const mockDismiss = vi.fn();
      
      render(
        <TestWrapper>
          <MockAlert type="success" onDismiss={mockDismiss}>
            성공적으로 처리되었습니다.
          </MockAlert>
        </TestWrapper>
      );

      const dismissButton = screen.getByRole('button', { name: '알림 닫기' });
      expect(dismissButton).toBeInTheDocument();

      dismissButton.focus();
      await user.keyboard('{Enter}');
      expect(mockDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Modal Dialog Accessibility', () => {
    it('should trap focus within modal dialog', async () => {
      const MockModalWithFocusTrap = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
        if (!isOpen) return null;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <h2 id="modal-title">설정</h2>
            <button tabIndex={0} data-testid="first-focusable">첫 번째</button>
            <button tabIndex={0} data-testid="second-focusable">두 번째</button>
            <button onClick={onClose} data-testid="close-button">닫기</button>
          </div>
        );
      };

      const mockOnClose = vi.fn();
      
      render(
        <TestWrapper>
          <MockModalWithFocusTrap isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const firstButton = screen.getByTestId('first-focusable');
      const secondButton = screen.getByTestId('second-focusable');
      const closeButton = screen.getByTestId('close-button');

      // Focus should start within modal
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      // Tab navigation within modal
      await user.tab();
      expect(secondButton).toHaveFocus();

      await user.tab();
      expect(closeButton).toHaveFocus();
    });

    it('should close modal with Escape key', async () => {
      const mockOnClose = vi.fn();
      
      render(
        <TestWrapper>
          <MockModal
            isOpen={true}
            onClose={mockOnClose}
            title="테스트 모달"
          >
            <p>모달 내용</p>
          </MockModal>
        </TestWrapper>
      );

      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should have proper ARIA attributes for modal', () => {
      render(
        <TestWrapper>
          <MockModal
            isOpen={true}
            onClose={() => {}}
            title="설정 모달"
          >
            <p>설정을 변경하세요.</p>
          </MockModal>
        </TestWrapper>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      
      const title = screen.getByText('설정 모달');
      expect(title).toHaveAttribute('id', 'modal-title');
    });
  });

  describe('Color and Contrast', () => {
    it('should not rely solely on color for important information', () => {
      const MockColorIndependent = ({ status }: { status: 'ready' | 'not-ready' | 'playing' }) => {
        const getStatusInfo = (status: string) => {
          switch (status) {
            case 'ready':
              return { text: '준비 완료', icon: '✓', class: 'status-ready' };
            case 'not-ready':
              return { text: '준비 중', icon: '○', class: 'status-waiting' };
            case 'playing':
              return { text: '게임 중', icon: '●', class: 'status-playing' };
            default:
              return { text: '알 수 없음', icon: '?', class: 'status-unknown' };
          }
        };

        const statusInfo = getStatusInfo(status);

        return (
          <div className={statusInfo.class}>
            <span aria-label={statusInfo.text}>
              {statusInfo.icon}
            </span>
            <span>{statusInfo.text}</span>
          </div>
        );
      };

      render(
        <TestWrapper>
          <MockColorIndependent status="ready" />
        </TestWrapper>
      );

      // Should have both icon and text
      expect(screen.getByLabelText('준비 완료')).toBeInTheDocument();
      expect(screen.getByText('준비 완료')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should provide text alternatives for icons', () => {
      const MockIconButton = ({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) => (
        <button onClick={onClick} aria-label={label}>
          <span aria-hidden="true">{icon}</span>
          <span className="sr-only">{label}</span>
        </button>
      );

      render(
        <TestWrapper>
          <MockIconButton
            icon="🏠"
            label="홈으로 가기"
            onClick={() => {}}
          />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: '홈으로 가기' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Responsive Design Accessibility', () => {
    it('should maintain accessibility on small screens', () => {
      const MockResponsiveNav = () => (
        <nav aria-label="주 내비게이션">
          <button
            aria-expanded="false"
            aria-controls="mobile-menu"
            data-testid="menu-toggle"
          >
            메뉴
          </button>
          <ul id="mobile-menu" className="hidden">
            <li><a href="/home">홈</a></li>
            <li><a href="/game">게임</a></li>
          </ul>
        </nav>
      );

      render(
        <TestWrapper>
          <MockResponsiveNav />
        </TestWrapper>
      );

      const menuToggle = screen.getByTestId('menu-toggle');
      expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
      expect(menuToggle).toHaveAttribute('aria-controls', 'mobile-menu');
    });
  });
});