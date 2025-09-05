import React, {useCallback, useMemo, useState} from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {AlertCircle, Check, Clock, Crown, Shield, Target, Wifi, WifiOff} from 'lucide-react';
import {Player, TooltipContent} from '../types';
import {LoadingSkeleton} from './LoadingSkeleton';

// Enhanced Game Card with accessibility
interface GameCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  ariaLabel?: string;
}

export const GameCard: React.FC<GameCardProps> = ({ 
  title, 
  children, 
  className = '', 
  isLoading = false,
  error,
  onRetry,
  ariaLabel
}) => {
  if (error) {
    return (
      <div 
        className={`game-card ${className}`} 
        style={{ padding: '24px' }}
        role="alert"
        aria-label={ariaLabel || `오류: ${error}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <AlertCircle size={20} style={{ color: 'var(--color-accent-danger)' }} />
          <h3 style={{ 
            color: 'var(--color-accent-danger)', 
            fontSize: '18px', 
            fontWeight: '600',
            margin: 0
          }}>
            오류 발생
          </h3>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          {error}
        </p>
        {onRetry && (
          <button 
            className="game-button"
            onClick={onRetry}
            style={{ 
              backgroundColor: 'var(--color-accent-primary)', 
              color: 'var(--color-text-primary)', 
              padding: '8px 16px' 
            }}
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`game-card ${className}`} 
      style={{ padding: '24px' }}
      role={title ? 'region' : undefined}
      aria-label={ariaLabel || title}
    >
      {title && (
        <h3 style={{ 
          color: 'var(--color-text-primary)', 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '20px',
          margin: 0
        }}>
          {title}
        </h3>
      )}
      {isLoading ? (
        <div role="status" aria-label="로딩 중...">
          <LoadingSkeleton height="100px" />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

// Enhanced Game Button with accessibility and loading states
interface GameButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  children: React.ReactNode;
  icon?: React.ComponentType<{ size?: number }>;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  tooltip?: TooltipContent;
  shortcut?: string;
}

export const GameButton: React.FC<GameButtonProps> = ({ 
  variant = 'primary', 
  children, 
  icon: Icon, 
  onClick, 
  disabled = false,
  loading = false,
  className = '',
  ariaLabel,
  tooltip,
  shortcut,
  style
}) => {
  const variants = {
    primary: { backgroundColor: 'var(--color-accent-primary)', color: 'var(--color-text-primary)' },
    secondary: { backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '2px solid var(--color-card-border)' },
    danger: { backgroundColor: 'var(--color-accent-danger)', color: 'var(--color-text-primary)' },
    success: { backgroundColor: 'var(--color-accent-success)', color: 'var(--color-text-primary)' }
  };

  const button = (
    <button
      className={`game-button ${className}`}
      style={{
        ...variants[variant],
        padding: '12px 20px',
        opacity: disabled || loading ? 0.5 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        position: 'relative',
        ...style
      }}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-describedby={tooltip ? 'button-tooltip' : undefined}
    >
      {loading ? (
        <>
          <div
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid currentColor',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
            aria-hidden="true"
          />
          로딩중...
        </>
      ) : (
        <>
          {Icon && <Icon size={16} />}
          {children}
          {shortcut && (
            <kbd style={{
              marginLeft: '8px',
              padding: '2px 6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'monospace'
            }}>
              {shortcut}
            </kbd>
          )}
        </>
      )}
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            {button}
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content 
              className="tooltip-content"
              side="top"
              sideOffset={5}
              id="button-tooltip"
            >
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {tooltip.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {tooltip.description}
                </div>
                {tooltip.shortcut && (
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '11px', 
                    color: 'var(--color-text-muted)' 
                  }}>
                    단축키: <kbd>{tooltip.shortcut}</kbd>
                  </div>
                )}
              </div>
              <Tooltip.Arrow />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  }

  return button;
};

// Enhanced Progress Bar with accessibility
interface ProgressBarProps {
  value: number;
  variant?: 'primary' | 'success' | 'danger' | 'warning';
  className?: string;
  label?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  variant = 'primary', 
  className = '',
  label,
  showPercentage = true
}) => {
  const colors = {
    primary: 'var(--color-accent-primary)',
    success: 'var(--color-accent-success)',
    danger: 'var(--color-accent-danger)',
    warning: 'var(--color-accent-warning)'
  };

  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`progress-container ${className}`}>
      {label && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '8px' 
        }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            {label}
          </span>
          {showPercentage && (
            <span style={{ 
              color: 'var(--color-text-secondary)', 
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              {Math.round(normalizedValue)}%
            </span>
          )}
        </div>
      )}
      <div 
        className="progress-bar" 
        style={{ height: '12px' }}
        role="progressbar"
        aria-valuenow={normalizedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `진행률 ${Math.round(normalizedValue)}%`}
      >
        <div
          className="progress-fill"
          style={{
            width: `${normalizedValue}%`,
            background: `linear-gradient(90deg, ${colors[variant]}, ${colors[variant]}cc)`
          }}
        />
      </div>
    </div>
  );
};

// Enhanced Player Card with accessibility and interactions
interface PlayerCardProps {
  player: Player;
  isSelected?: boolean;
  onSelect?: (playerId: string) => void;
  onVote?: (playerId: string) => void;
  isVotingMode?: boolean;
  canVote?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  isSelected = false,
  onSelect,
  onVote,
  isVotingMode = false,
  canVote = true
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (isVotingMode && canVote && onVote) {
      onVote(player.id);
    } else if (onSelect) {
      onSelect(player.id);
    }
  }, [isVotingMode, canVote, onVote, onSelect, player.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const connectionIcon = useMemo(() => {
    return player.connectionQuality === 'poor' ? WifiOff : Wifi;
  }, [player.connectionQuality]);

  const ConnectionIcon = connectionIcon;

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div 
            className={`game-card player-card animate-slide-in ${isSelected ? 'animate-glow' : ''}`}
            style={{ 
              padding: '20px',
              cursor: (isVotingMode && canVote) || onSelect ? 'pointer' : 'default',
              border: isSelected ? '2px solid var(--color-accent-primary)' : undefined,
              transform: isHovered ? 'translateY(-2px)' : undefined
            }}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role={isVotingMode ? 'button' : 'article'}
            tabIndex={(isVotingMode && canVote) || onSelect ? 0 : -1}
            aria-label={`플레이어 ${player.name}, 역할: ${
              player.role === 'citizen' ? '시민' : 
              player.role === 'liar' ? '라이어' : '미확인'
            }, 상태: ${
              player.status === 'online' ? '온라인' : 
              player.status === 'away' ? '자리비움' : '오프라인'
            }${player.isHost ? ', 방장' : ''}${
              isVotingMode && canVote ? ', 투표하려면 클릭하거나 Enter 키를 누르세요' : ''
            }`}
            aria-selected={isSelected}
          >
            {/* Host Crown */}
            {player.isHost && (
              <Crown 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  top: '-8px', 
                  right: '-8px', 
                  color: 'var(--color-accent-warning)',
                  backgroundColor: 'var(--color-card-bg)',
                  borderRadius: '50%',
                  padding: '4px'
                }} 
                aria-label="방장"
              />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--border-radius-md)',
                    background: player.avatar || `linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-purple))`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-primary)',
                    fontWeight: '600',
                    fontSize: '18px'
                  }}
                  role="img"
                  aria-label={`${player.name} 아바타`}
                >
                  {!player.avatar && player.name[0]}
                </div>
                
                {/* Status Indicator */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: player.status === 'online' ? 'var(--color-online)' : 
                                    player.status === 'away' ? 'var(--color-away)' : 'var(--color-offline)',
                    border: '2px solid var(--color-card-bg)'
                  }}
                  aria-label={`상태: ${player.status === 'online' ? '온라인' : player.status === 'away' ? '자리비움' : '오프라인'}`}
                />

                {/* Connection Quality Indicator */}
                {player.connectionQuality === 'poor' && (
                  <ConnectionIcon 
                    size={12}
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      left: '-2px',
                      color: 'var(--color-accent-danger)',
                      backgroundColor: 'var(--color-card-bg)',
                      borderRadius: '50%',
                      padding: '2px'
                    }}
                    aria-label="연결 불안정"
                  />
                )}
              </div>

              <div>
                <div style={{ color: 'var(--color-text-primary)', fontWeight: '600', marginBottom: '4px' }}>
                  {player.name}
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                  {player.role !== 'unknown' ? (
                    <span style={{ 
                      color: player.role === 'citizen' ? 'var(--color-accent-success)' : 'var(--color-accent-danger)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {player.role === 'citizen' ? <Shield size={12} /> : <Target size={12} />}
                      {player.role === 'citizen' ? '시민' : '라이어'}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>미확인</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {player.hasVoted ? (
                  <span style={{ 
                    color: 'var(--color-accent-success)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px' 
                  }}>
                    <Check size={16} />
                    투표 완료
                  </span>
                ) : (
                  <span style={{ 
                    color: 'var(--color-text-muted)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px' 
                  }}>
                    <Clock size={16} />
                    대기 중
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {player.votesReceived > 0 && (
                  <span
                    style={{
                      backgroundColor: 'var(--color-accent-danger)30',
                      color: 'var(--color-accent-danger)',
                      padding: '4px 8px',
                      borderRadius: 'var(--border-radius-sm)',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                    aria-label={`받은 표: ${player.votesReceived}표`}
                  >
                    {player.votesReceived} 표
                  </span>
                )}
                <span
                  style={{
                    color: player.isAlive ? 'var(--color-accent-success)' : 'var(--color-accent-danger)',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  {player.isAlive ? '생존' : '제거됨'}
                </span>
              </div>
            </div>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tooltip-content" side="top" sideOffset={5}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {player.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                {player.role === 'citizen' ? '시민: 라이어를 찾아 투표하세요' :
                 player.role === 'liar' ? '라이어: 정체를 숨기고 생존하세요' :
                 '역할 미확인: 게임이 진행되면서 드러납니다'}
              </div>
              {isVotingMode && canVote && (
                <div style={{ fontSize: '11px', color: 'var(--color-accent-primary)' }}>
                  클릭하여 투표하기 • 단축키: V
                </div>
              )}
            </div>
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

// Enhanced Connection Status Component
interface ConnectionStatusProps {
  isConnected: boolean;
  reconnectAttempts?: number;
  onReconnect?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  reconnectAttempts = 0,
  onReconnect
}) => {
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        padding: '8px 12px',
        borderRadius: 'var(--border-radius-sm)',
        backgroundColor: isConnected ? 'var(--color-accent-success)20' : 'var(--color-accent-danger)20',
        border: `1px solid ${isConnected ? 'var(--color-accent-success)' : 'var(--color-accent-danger)'}`
      }}
      role="status"
      aria-live="polite"
      aria-label={isConnected ? '서버에 연결됨' : '서버 연결 끊어짐'}
    >
      {isConnected ? (
        <Wifi size={16} style={{ color: 'var(--color-accent-success)' }} />
      ) : (
        <WifiOff size={16} style={{ color: 'var(--color-accent-danger)' }} />
      )}
      <span style={{ 
        fontSize: '12px',
        color: isConnected ? 'var(--color-accent-success)' : 'var(--color-accent-danger)',
        fontWeight: '600'
      }}>
        {isConnected ? '연결됨' : `연결 끊어짐${reconnectAttempts > 0 ? ` (재시도 ${reconnectAttempts})` : ''}`}
      </span>
      {!isConnected && onReconnect && (
        <button
          onClick={onReconnect}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-accent-danger)',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
          aria-label="수동으로 다시 연결"
        >
          재연결
        </button>
      )}
    </div>
  );
};