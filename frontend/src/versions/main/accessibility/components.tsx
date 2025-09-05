import React, {forwardRef, ReactNode} from 'react';
import {cn} from '../lib/utils';

// 접근 가능한 버튼 컴포넌트
export const AccessibleButton = forwardRef<
  HTMLButtonElement,
  {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    ariaLabel?: string;
    ariaDescribedBy?: string;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    type?: 'button' | 'submit' | 'reset';
    className?: string;
  }
>(({ children, ariaLabel, ariaDescribedBy, variant = 'primary', size = 'md', type = 'button', className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={cn(
        // 기본 스타일
        'font-medium rounded-md transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',

        // 크기별 스타일
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },

        // 변형별 스타일
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500': variant === 'danger',
        },

        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

// 접근 가능한 입력 필드
export const AccessibleInput = forwardRef<
  HTMLInputElement,
  {
    label: string;
    error?: string;
    helper?: string;
    required?: boolean;
    type?: string;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
  } & React.InputHTMLAttributes<HTMLInputElement>
>(({ label, error, helper, required, className, inputClassName, id, ...props }, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helper ? `${inputId}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="필수">*</span>}
      </label>

      <input
        ref={ref}
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required}
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:bg-gray-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          inputClassName
        )}
        {...props}
      />

      {helper && (
        <p id={helperId} className="text-sm text-gray-600">
          {helper}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

AccessibleInput.displayName = 'AccessibleInput';

// 접근 가능한 모달
export const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  children,
  className
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) => {
  React.useEffect(() => {
    if (!isOpen) return;

    // 모달이 열릴 때 포커스 트랩
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 모달 콘텐츠 */}
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6',
          'focus:outline-none',
          className
        )}
        role="document"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            aria-label="모달 닫기"
            data-dismiss
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
};

// 접근 가능한 탭 시스템
export const AccessibleTabs = ({
  tabs,
  activeTab,
  onTabChange,
  className
}: {
  tabs: Array<{ id: string; label: string; content: ReactNode }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}) => {
  const handleKeyDown = (e: React.KeyboardEvent, tabId: string, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = (index + 1) % tabs.length;
        onTabChange(tabs[nextIndex].id);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = index > 0 ? index - 1 : tabs.length - 1;
        onTabChange(tabs[prevIndex].id);
        break;
      case 'Home':
        e.preventDefault();
        onTabChange(tabs[0].id);
        break;
      case 'End':
        e.preventDefault();
        onTabChange(tabs[tabs.length - 1].id);
        break;
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* 탭 목록 */}
      <div
        role="tablist"
        className="flex border-b border-gray-200"
        aria-label="탭 목록"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id, index)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 패널 */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          className="py-4"
          tabIndex={0}
        >
          {activeTab === tab.id && tab.content}
        </div>
      ))}
    </div>
  );
};
