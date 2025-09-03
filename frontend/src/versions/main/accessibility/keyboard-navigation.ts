import React from 'react';

export class KeyboardNavigationManager {
  private focusableElements: HTMLElement[] = [];
  private currentFocusIndex = -1;
  private keyMap: Map<string, () => void> = new Map();
  private container: HTMLElement;
  private focusTrapActive = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.updateFocusableElements();
    this.setupKeyboardListeners();
  }

  // 포커스 트랩 활성화/비활성화
  enableFocusTrap() {
    this.focusTrapActive = true;
    this.updateFocusableElements();
  }

  disableFocusTrap() {
    this.focusTrapActive = false;
  }

  // 특정 요소로 포커스 이동
  focusTo(selector: string) {
    const element = this.container.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }

  // 키 매핑 추가
  addKeyMapping(key: string, handler: () => void) {
    this.keyMap.set(key, handler);
  }

  // 키 매핑 제거
  removeKeyMapping(key: string) {
    this.keyMap.delete(key);
  }

  // 정리
  destroy() {
    this.container.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.container.removeEventListener('focusin', this.handleFocusIn.bind(this));
    this.keyMap.clear();
    this.focusableElements = [];
  }

  private updateFocusableElements() {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="tab"]:not([disabled])',
      '[role="gridcell"]:not([disabled])',
      '[role="option"]:not([disabled])'
    ].join(', ');

    this.focusableElements = Array.from(this.container.querySelectorAll(selector));
    this.currentFocusIndex = this.focusableElements.indexOf(document.activeElement as HTMLElement);
  }

  private setupKeyboardListeners() {
    // 기본 키보드 단축키 설정
    this.keyMap.set('Tab', () => this.handleTabNavigation(1));
    this.keyMap.set('Shift+Tab', () => this.handleTabNavigation(-1));
    this.keyMap.set('ArrowRight', () => this.handleArrowNavigation(1));
    this.keyMap.set('ArrowLeft', () => this.handleArrowNavigation(-1));
    this.keyMap.set('ArrowDown', () => this.handleGridNavigation('down'));
    this.keyMap.set('ArrowUp', () => this.handleGridNavigation('up'));
    this.keyMap.set('Home', () => this.focusFirst());
    this.keyMap.set('End', () => this.focusLast());
    this.keyMap.set('Escape', () => this.handleEscape());

    // 게임 특화 단축키
    this.keyMap.set('Enter', () => this.handleEnter());
    this.keyMap.set(' ', () => this.handleSpace());
    this.keyMap.set('v', () => this.handleVote());
    this.keyMap.set('V', () => this.handleVote());
    this.keyMap.set('h', () => this.handleHelp());
    this.keyMap.set('H', () => this.handleHelp());

    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.container.addEventListener('focusin', this.handleFocusIn.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent) {
    const key = this.getKeyString(e);
    const handler = this.keyMap.get(key);

    if (handler) {
      e.preventDefault();
      handler();
    }

    // 포커스 요소 업데이트
    this.updateFocusableElements();
  }

  private handleFocusIn(e: FocusEvent) {
    const target = e.target as HTMLElement;
    const index = this.focusableElements.indexOf(target);
    if (index !== -1) {
      this.currentFocusIndex = index;
    }
  }

  private getKeyString(e: KeyboardEvent): string {
    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    parts.push(e.key);
    return parts.join('+');
  }

  private handleTabNavigation(direction: number) {
    if (this.focusableElements.length === 0) return;

    let newIndex = this.currentFocusIndex + direction;

    // 포커스 트랩이 활성화된 경우 순환
    if (this.focusTrapActive) {
      if (newIndex >= this.focusableElements.length) {
        newIndex = 0;
      } else if (newIndex < 0) {
        newIndex = this.focusableElements.length - 1;
      }
    } else {
      // 일반적인 탭 네비게이션
      newIndex = Math.max(0, Math.min(newIndex, this.focusableElements.length - 1));
    }

    this.focusElement(newIndex);
  }

  private handleArrowNavigation(direction: number) {
    const activeElement = document.activeElement as HTMLElement;
    const role = activeElement?.getAttribute('role');

    // 역할에 따른 방향키 네비게이션
    if (role === 'gridcell' || role === 'option' || role === 'tab') {
      this.handleTabNavigation(direction);
    } else if (role === 'button' || activeElement?.tagName === 'BUTTON') {
      // 버튼 그룹 내 네비게이션
      this.handleButtonGroupNavigation(direction);
    }
  }

  private handleGridNavigation(direction: 'up' | 'down') {
    const activeElement = document.activeElement as HTMLElement;
    const role = activeElement?.getAttribute('role');

    if (role === 'gridcell') {
      // 그리드 내 상하 이동
      const gridColumns = this.detectGridColumns();
      const offset = direction === 'down' ? gridColumns : -gridColumns;
      const newIndex = this.currentFocusIndex + offset;

      if (newIndex >= 0 && newIndex < this.focusableElements.length) {
        this.focusElement(newIndex);
      }
    } else {
      // 일반적인 상하 이동
      this.handleTabNavigation(direction === 'down' ? 1 : -1);
    }
  }

  private handleButtonGroupNavigation(direction: number) {
    // 버튼 그룹 내에서만 이동
    const activeElement = document.activeElement as HTMLElement;
    const buttonGroup = activeElement.closest('[role="group"], .button-group');

    if (buttonGroup) {
      const buttons = Array.from(buttonGroup.querySelectorAll('button:not([disabled])'));
      const currentIndex = buttons.indexOf(activeElement);

      if (currentIndex !== -1) {
        let newIndex = currentIndex + direction;
        if (newIndex >= buttons.length) newIndex = 0;
        if (newIndex < 0) newIndex = buttons.length - 1;

        (buttons[newIndex] as HTMLElement).focus();
      }
    }
  }

  private detectGridColumns(): number {
    // CSS Grid 또는 Flexbox에서 컬럼 수 감지
    const activeElement = document.activeElement as HTMLElement;
    const grid = activeElement.closest('[style*="grid-template-columns"], .grid');

    if (grid) {
      const style = window.getComputedStyle(grid);
      const gridColumns = style.gridTemplateColumns;

      if (gridColumns && gridColumns !== 'none') {
        return gridColumns.split(' ').length;
      }
    }

    // 기본값으로 4컬럼 가정
    return 4;
  }

  private focusFirst() {
    this.focusElement(0);
  }

  private focusLast() {
    this.focusElement(this.focusableElements.length - 1);
  }

  private focusElement(index: number) {
    if (index >= 0 && index < this.focusableElements.length) {
      this.currentFocusIndex = index;
      this.focusableElements[index].focus();

      // 스크롤 조정
      this.scrollIntoView(this.focusableElements[index]);
    }
  }

  private scrollIntoView(element: HTMLElement) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  }

  private handleEscape() {
    // 모달 닫기
    const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]');
    if (activeModal) {
      const closeButton = activeModal.querySelector('[data-dismiss]') as HTMLElement;
      closeButton?.click();
      return;
    }

    // 메뉴 닫기
    const openMenu = document.querySelector('[role="menu"][aria-hidden="false"]');
    if (openMenu) {
      const menuButton = document.querySelector('[aria-expanded="true"]') as HTMLElement;
      menuButton?.click();
      return;
    }

    // 포커스 트랩 해제
    this.focusTrapActive = false;
  }

  private handleEnter() {
    const activeElement = document.activeElement as HTMLElement;

    if (activeElement.tagName === 'BUTTON' || activeElement.getAttribute('role') === 'button') {
      activeElement.click();
    }
  }

  private handleSpace() {
    const activeElement = document.activeElement as HTMLElement;

    // 체크박스, 라디오 버튼, 버튼에 대한 스페이스 처리
    if (activeElement.tagName === 'INPUT' &&
        ['checkbox', 'radio'].includes((activeElement as HTMLInputElement).type)) {
      (activeElement as HTMLInputElement).checked = !(activeElement as HTMLInputElement).checked;
      activeElement.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (activeElement.getAttribute('role') === 'button') {
      activeElement.click();
    }
  }

  private handleVote() {
    // 게임 특화: 투표 기능
    const activeElement = document.activeElement as HTMLElement;
    const playerCard = activeElement.closest('[data-player-card]');

    if (playerCard) {
      const voteEvent = new CustomEvent('keyboard-vote', {
        bubbles: true,
        detail: { element: playerCard }
      });
      playerCard.dispatchEvent(voteEvent);
    }
  }

  private handleHelp() {
    // 도움말 표시
    const helpEvent = new CustomEvent('keyboard-help', { bubbles: true });
    this.container.dispatchEvent(helpEvent);
  }
}

// React 훅으로 키보드 네비게이션 사용
export const useKeyboardNavigation = (containerRef: React.RefObject<HTMLElement>) => {
  const managerRef = React.useRef<KeyboardNavigationManager>();

  React.useEffect(() => {
    if (containerRef.current && !managerRef.current) {
      managerRef.current = new KeyboardNavigationManager(containerRef.current);
    }

    return () => {
      managerRef.current?.destroy();
      managerRef.current = undefined;
    };
  }, [containerRef]);

  return managerRef.current;
};

// 게임 특화 키보드 단축키 프리셋
export const gameKeyboardPresets = {
  playerSelection: {
    'ArrowRight': 'nextPlayer',
    'ArrowLeft': 'prevPlayer',
    'Enter': 'selectPlayer',
    'v': 'votePlayer',
    'Escape': 'cancelSelection'
  },

  chatInput: {
    'Enter': 'sendMessage',
    'Escape': 'clearInput',
    'ArrowUp': 'previousMessage',
    'ArrowDown': 'nextMessage'
  },

  gameControls: {
    'Space': 'togglePause',
    'r': 'restart',
    'h': 'showHelp',
    'q': 'quit'
  }
};