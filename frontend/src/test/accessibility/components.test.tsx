import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
    AccessibleButton,
    AccessibleInput,
    AccessibleModal,
    AccessibleTabs
} from '../../versions/main/accessibility/components';

describe('접근성 컴포넌트 테스트', () => {
  describe('AccessibleButton', () => {
    it('기본 버튼이 올바르게 렌더링되어야 한다', () => {
      render(<AccessibleButton>Click me</AccessibleButton>);

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('aria-label이 올바르게 설정되어야 한다', () => {
      render(
        <AccessibleButton ariaLabel="Custom label">
          Button text
        </AccessibleButton>
      );

      const button = screen.getByRole('button', { name: 'Custom label' });
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('비활성화 상태가 올바르게 처리되어야 한다', () => {
      render(<AccessibleButton disabled>Disabled</AccessibleButton>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('포커스 스타일이 적용되어야 한다', async () => {
      const user = userEvent.setup();
      render(<AccessibleButton>Focus me</AccessibleButton>);

      const button = screen.getByRole('button');
      await user.tab();

      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('키보드로 활성화 가능해야 한다', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<AccessibleButton onClick={onClick}>Activate</AccessibleButton>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('변형별 스타일이 올바르게 적용되어야 한다', () => {
      const { rerender } = render(<AccessibleButton variant="primary">Primary</AccessibleButton>);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600');

      rerender(<AccessibleButton variant="secondary">Secondary</AccessibleButton>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-200');

      rerender(<AccessibleButton variant="danger">Danger</AccessibleButton>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });
  });

  describe('AccessibleInput', () => {
    it('라벨과 입력 필드가 올바르게 연결되어야 한다', () => {
      render(<AccessibleInput label="이름" placeholder="이름을 입력하세요" />);

      const input = screen.getByLabelText('이름');
      const label = screen.getByText('이름');

      expect(input).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', '이름을 입력하세요');
    });

    it('필수 필드 표시가 올바르게 되어야 한다', () => {
      render(<AccessibleInput label="이메일" required />);

      const input = screen.getByLabelText('이메일 *');
      const asterisk = screen.getByText('*');

      expect(input).toBeRequired();
      expect(asterisk).toHaveAttribute('aria-label', '필수');
    });

    it('에러 상태가 올바르게 처리되어야 한다', () => {
      render(<AccessibleInput label="비밀번호" error="비밀번호가 너무 짧습니다" />);

      const input = screen.getByLabelText('비밀번호');
      const error = screen.getByRole('alert');

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(error).toHaveTextContent('비밀번호가 너무 짧습니다');
      expect(input).toHaveClass('border-red-500');
    });

    it('도움말 텍스트가 올바르게 연결되어야 한다', () => {
      render(<AccessibleInput label="사용자명" helper="영문과 숫자만 사용 가능" />);

      const input = screen.getByLabelText('사용자명');
      const helper = screen.getByText('영문과 숫자만 사용 가능');

      expect(input).toHaveAttribute('aria-describedby');
      expect(helper).toBeInTheDocument();
    });
  });

  describe('AccessibleModal', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('모달이 열렸을 때 올바르게 렌더링되어야 한다', () => {
      render(
        <AccessibleModal isOpen={true} onClose={mockOnClose} title="테스트 모달">
          <p>모달 내용</p>
        </AccessibleModal>
      );

      const modal = screen.getByRole('dialog');
      const title = screen.getByText('테스트 모달');
      const content = screen.getByText('모달 내용');

      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(title).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });

    it('닫기 버튼이 작동해야 한다', async () => {
      const user = userEvent.setup();
      render(
        <AccessibleModal isOpen={true} onClose={mockOnClose} title="테스트 모달">
          <p>내용</p>
        </AccessibleModal>
      );

      const closeButton = screen.getByLabelText('모달 닫기');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('ESC 키로 모달을 닫을 수 있어야 한다', async () => {
      const user = userEvent.setup();
      render(
        <AccessibleModal isOpen={true} onClose={mockOnClose} title="테스트 모달">
          <p>내용</p>
        </AccessibleModal>
      );

      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('백드롭 클릭으로 모달을 닫을 수 있어야 한다', async () => {
      const user = userEvent.setup();
      render(
        <AccessibleModal isOpen={true} onClose={mockOnClose} title="테스트 모달">
          <p>내용</p>
        </AccessibleModal>
      );

      const backdrop = screen.getByRole('dialog').previousSibling as HTMLElement;
      await user.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('모달이 닫혀있을 때는 렌더링되지 않아야 한다', () => {
      render(
        <AccessibleModal isOpen={false} onClose={mockOnClose} title="테스트 모달">
          <p>내용</p>
        </AccessibleModal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('AccessibleTabs', () => {
    const mockTabs = [
      { id: 'tab1', label: '탭 1', content: <div>탭 1 내용</div> },
      { id: 'tab2', label: '탭 2', content: <div>탭 2 내용</div> },
      { id: 'tab3', label: '탭 3', content: <div>탭 3 내용</div> },
    ];

    const mockOnTabChange = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('탭 목록과 패널이 올바르게 렌더링되어야 한다', () => {
      render(
        <AccessibleTabs
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={mockOnTabChange}
        />
      );

      const tablist = screen.getByRole('tablist');
      const tab1 = screen.getByRole('tab', { name: '탭 1' });
      const panel1 = screen.getByRole('tabpanel');

      expect(tablist).toBeInTheDocument();
      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(panel1).toHaveTextContent('탭 1 내용');
    });

    it('탭 클릭이 올바르게 처리되어야 한다', async () => {
      const user = userEvent.setup();
      render(
        <AccessibleTabs
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={mockOnTabChange}
        />
      );

      const tab2 = screen.getByRole('tab', { name: '탭 2' });
      await user.click(tab2);

      expect(mockOnTabChange).toHaveBeenCalledWith('tab2');
    });

    it('키보드 네비게이션이 작동해야 한다', async () => {
      const user = userEvent.setup();
      render(
        <AccessibleTabs
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={mockOnTabChange}
        />
      );

      const tab1 = screen.getByRole('tab', { name: '탭 1' });
      tab1.focus();

      await user.keyboard('{ArrowRight}');
      expect(mockOnTabChange).toHaveBeenCalledWith('tab2');

      await user.keyboard('{Home}');
      expect(mockOnTabChange).toHaveBeenCalledWith('tab1');

      await user.keyboard('{End}');
      expect(mockOnTabChange).toHaveBeenCalledWith('tab3');
    });

    it('활성 탭만 포커스 가능해야 한다', () => {
      render(
        <AccessibleTabs
          tabs={mockTabs}
          activeTab="tab2"
          onTabChange={mockOnTabChange}
        />
      );

      const tab1 = screen.getByRole('tab', { name: '탭 1' });
      const tab2 = screen.getByRole('tab', { name: '탭 2' });
      const tab3 = screen.getByRole('tab', { name: '탭 3' });

      expect(tab1).toHaveAttribute('tabIndex', '-1');
      expect(tab2).toHaveAttribute('tabIndex', '0');
      expect(tab3).toHaveAttribute('tabIndex', '-1');
    });

    it('비활성 패널은 숨겨져야 한다', () => {
      render(
        <AccessibleTabs
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={mockOnTabChange}
        />
      );

      const panel1 = screen.getByRole('tabpanel', { hidden: false });
      expect(panel1).toHaveTextContent('탭 1 내용');

      // 다른 패널들은 숨겨져 있어야 함
      expect(screen.queryByText('탭 2 내용')).not.toBeInTheDocument();
      expect(screen.queryByText('탭 3 내용')).not.toBeInTheDocument();
    });
  });
});
