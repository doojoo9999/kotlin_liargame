import React from 'react';

interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--border-radius-sm)',
  className = ''
}) => (
  <div 
    className={`loading-skeleton ${className}`}
    style={{
      width,
      height,
      borderRadius
    }}
    role="status"
    aria-label="로딩 중..."
  />
);

export const PlayerCardSkeleton: React.FC = () => (
  <div 
    className="game-card animate-pulse" 
    style={{ padding: '20px' }}
    role="status"
    aria-label="플레이어 정보 로딩 중"
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
      <LoadingSkeleton
        width="48px"
        height="48px"
        borderRadius="var(--border-radius-md)"
      />
      <div>
        <LoadingSkeleton
          width="80px"
          height="16px"
          className="mb-2"
        />
        <LoadingSkeleton
          width="60px"
          height="12px"
        />
      </div>
    </div>
    
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <LoadingSkeleton
        width="100px"
        height="16px"
      />
      <LoadingSkeleton
        width="60px"
        height="14px"
      />
    </div>
  </div>
);

export const GameStatsLoadingSkeleton: React.FC = () => (
  <div 
    className="game-card" 
    style={{ padding: '24px' }}
    role="status"
    aria-label="게임 통계 로딩 중"
  >
    <LoadingSkeleton
      width="200px"
      height="24px"
      className="mb-4"
    />
    
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: '20px' 
    }}>
      {[1, 2, 3, 4].map(index => (
        <div 
          key={index}
          style={{ 
            textAlign: 'center', 
            padding: '20px', 
            borderRadius: 'var(--border-radius-md)',
            background: 'var(--color-card-hover)'
          }}
        >
          <LoadingSkeleton
            width="60px"
            height="32px"
            className="mb-2 mx-auto"
          />
          <LoadingSkeleton
            width="80px"
            height="14px"
            className="mx-auto"
          />
        </div>
      ))}
    </div>
  </div>
);

interface SkeletonListProps {
  count: number;
  itemHeight?: number;
  itemComponent?: React.ComponentType;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ 
  count, 
  itemHeight = 120,
  itemComponent: ItemComponent = PlayerCardSkeleton
}) => (
  <div 
    style={{ display: 'grid', gap: '16px' }}
    role="status"
    aria-label={`${count}개 항목 로딩 중`}
  >
    {Array.from({ length: count }, (_, index) => (
      <ItemComponent key={index} />
    ))}
  </div>
);

export const ChatLoadingSkeleton: React.FC = () => (
  <div 
    className="game-card" 
    style={{ padding: '20px', height: '300px' }}
    role="status"
    aria-label="채팅 로딩 중"
  >
    <LoadingSkeleton
      width="120px"
      height="20px"
      className="mb-4"
    />
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3, 4, 5].map(index => (
        <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <LoadingSkeleton
            width="32px"
            height="32px"
            borderRadius="50%"
          />
          <div style={{ flex: 1 }}>
            <LoadingSkeleton
              width="60px"
              height="14px"
              className="mb-1"
            />
            <LoadingSkeleton
              width={`${Math.random() * 60 + 40}%`}
              height="16px"
            />
          </div>
          <LoadingSkeleton
            width="40px"
            height="12px"
          />
        </div>
      ))}
    </div>
  </div>
);

// Screen reader friendly loading indicator
export const LoadingSpinner: React.FC<{ 
  size?: number; 
  label?: string;
  className?: string;
}> = ({ 
  size = 24, 
  label = "로딩 중...",
  className = ""
}) => (
  <div 
    className={`inline-flex items-center justify-center ${className}`}
    role="status"
    aria-label={label}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="31.416"
        strokeDashoffset="31.416"
        style={{ animation: 'spin-dash 1.5s ease-in-out infinite' }}
      />
    </svg>
    <span className="sr-only">{label}</span>
    
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      @keyframes spin-dash {
        0% {
          stroke-dasharray: 1, 31.416;
          stroke-dashoffset: 0;
        }
        50% {
          stroke-dasharray: 15.708, 31.416;
          stroke-dashoffset: -7.854;
        }
        100% {
          stroke-dasharray: 1, 31.416;
          stroke-dashoffset: -31.416;
        }
      }
      
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `}</style>
  </div>
);

// Loading overlay for the entire demo
export const DemoLoadingOverlay: React.FC<{ isVisible: boolean; message?: string }> = ({
  isVisible,
  message = "게임 데모 로딩 중..."
}) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
    >
      <div
        className="game-card"
        style={{
          padding: '32px',
          textAlign: 'center',
          maxWidth: '300px',
          margin: '20px'
        }}
      >
        <LoadingSpinner size={48} className="mb-4" />
        <h2 
          id="loading-title"
          style={{ 
            color: 'var(--color-text-primary)', 
            marginBottom: '8px',
            fontSize: '18px',
            fontWeight: '600'
          }}
        >
          {message}
        </h2>
        <p style={{ 
          color: 'var(--color-text-muted)', 
          fontSize: '14px',
          margin: 0 
        }}>
          잠시만 기다려 주세요...
        </p>
      </div>
    </div>
  );
};