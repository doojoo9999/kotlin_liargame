import React, {useEffect, useState} from 'react';
import {
    Activity,
    BarChart3,
    Check,
    Clock,
    Crown,
    Monitor,
    Play,
    Settings,
    Shield,
    Target,
    Users,
    Zap
} from 'lucide-react';

// 웹게임에 최적화된 색상 팔레트
const gameColors = {
  background: 'linear-gradient(135deg, #0f1419 0%, #1a1b1f 50%, #0f1419 100%)',
  cardBg: '#1e2328',
  cardHover: '#252a31',
  cardBorder: '#3d434a',
  textPrimary: '#ffffff',
  textSecondary: '#e2e8f0',
  textMuted: '#94a3b8',
  accent: {
    primary: '#60a5fa',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    purple: '#8b5cf6',
    cyan: '#06b6d4'
  },
  online: '#10b981',
  away: '#f59e0b',
  offline: '#6b7280'
};

// CSS 스타일
const gameStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes slideIn {
    from { transform: translateX(-10px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .game-demo-container {
    min-height: 100vh;
    background: ${gameColors.background};
    color: ${gameColors.textPrimary};
    font-family: system-ui, -apple-system, sans-serif;
  }
  
  .game-card {
    background: ${gameColors.cardBg};
    border: 2px solid ${gameColors.cardBorder};
    border-radius: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fadeInUp 0.6s ease-out;
  }
  
  .game-card:hover {
    background: ${gameColors.cardHover};
    border-color: ${gameColors.accent.primary};
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(96, 165, 250, 0.15);
  }
  
  .game-button {
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  
  .game-button:hover {
    transform: translateY(-1px);
  }
  
  .game-button:active {
    transform: translateY(0);
  }
  
  .animate-slide-in {
    animation: slideIn 0.5s ease-out;
  }
  
  .animate-pulse {
    animation: pulse 2s infinite;
  }
  
  .progress-bar {
    background: ${gameColors.cardBg};
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid ${gameColors.cardBorder};
  }
  
  .progress-fill {
    height: 100%;
    border-radius: 12px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .player-card {
    position: relative;
  }
`;

// 인터페이스 정의
interface Player {
  id: string;
  name: string;
  role: 'citizen' | 'liar' | 'unknown';
  status: 'online' | 'away' | 'offline';
  isAlive: boolean;
  hasVoted: boolean;
  votesReceived: number;
  isHost?: boolean;
}

interface GameState {
  phase: 'lobby' | 'discussion' | 'voting' | 'defense' | 'result';
  timeLeft: number;
  round: number;
  topic: string;
}

interface ChatMessage {
  id: string;
  author: string;
  content: string;
  time: string;
  type: 'user' | 'system';
}

// 메인 컴포넌트
export const IntegratedGameDemo: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [gameState, setGameState] = useState<GameState>({
    phase: 'discussion',
    timeLeft: 45,
    round: 1,
    topic: '빨간 과일'
  });

  const [players] = useState<Player[]>([
    { id: '1', name: 'Alex', role: 'citizen', status: 'online', isAlive: true, hasVoted: false, votesReceived: 0, isHost: true },
    { id: '2', name: 'Sarah', role: 'unknown', status: 'online', isAlive: true, hasVoted: true, votesReceived: 2 },
    { id: '3', name: 'Mike', role: 'liar', status: 'away', isAlive: true, hasVoted: false, votesReceived: 1 },
    { id: '4', name: 'Emma', role: 'citizen', status: 'online', isAlive: false, hasVoted: true, votesReceived: 0 },
    { id: '5', name: 'David', role: 'unknown', status: 'online', isAlive: true, hasVoted: true, votesReceived: 0 },
    { id: '6', name: 'Lisa', role: 'unknown', status: 'offline', isAlive: true, hasVoted: false, votesReceived: 0 }
  ]);

  const [chatMessages] = useState<ChatMessage[]>([
    { id: '1', author: 'Alex', content: '사과는 빨간 과일이죠!', time: '14:32', type: 'user' },
    { id: '2', author: 'Sarah', content: '토마토도 빨간색이에요', time: '14:33', type: 'user' },
    { id: '3', author: 'System', content: '투표 시간이 1분 남았습니다.', time: '14:34', type: 'system' },
    { id: '4', author: 'Mike', content: '딸기가 제일 대표적인 것 같은데...', time: '14:35', type: 'user' },
    { id: '5', author: 'Emma', content: '수박은 어떤가요?', time: '14:36', type: 'user' }
  ]);

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  // 타이머 및 실시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        timeLeft: prev.timeLeft > 0 ? prev.timeLeft - 1 : 45
      }));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // UI 컴포넌트들
  const GameCard: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = 
    ({ title, children, className = '' }) => (
    <div className={`game-card p-6 ${className}`} style={{ padding: '24px' }}>
      {title && (
        <h3 style={{ color: gameColors.textPrimary, fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );

  const GameButton: React.FC<{
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    children: React.ReactNode;
    icon?: any;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }> = ({ variant = 'primary', children, icon: Icon, onClick, disabled, className = '' }) => {
    const variants = {
      primary: { backgroundColor: gameColors.accent.primary, color: gameColors.textPrimary },
      secondary: { backgroundColor: 'transparent', color: gameColors.textSecondary, border: `2px solid ${gameColors.cardBorder}` },
      danger: { backgroundColor: gameColors.accent.danger, color: gameColors.textPrimary },
      success: { backgroundColor: gameColors.accent.success, color: gameColors.textPrimary }
    };

    return (
      <button
        className={`game-button ${className}`}
        style={{
          ...variants[variant],
          padding: '12px 20px',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
        onClick={onClick}
        disabled={disabled}
      >
        {Icon && <Icon size={16} />}
        {children}
      </button>
    );
  };

  const ProgressBar: React.FC<{ value: number; variant?: 'primary' | 'success' | 'danger'; className?: string }> = 
    ({ value, variant = 'primary', className = '' }) => {
    const colors = {
      primary: gameColors.accent.primary,
      success: gameColors.accent.success,
      danger: gameColors.accent.danger
    };

    return (
      <div className={`progress-bar ${className}`} style={{ height: '12px' }}>
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: `linear-gradient(90deg, ${colors[variant]}, ${colors[variant]}cc)`
          }}
        />
      </div>
    );
  };

  const PlayerCard: React.FC<{ player: Player }> = ({ player }) => (
    <div className="game-card player-card animate-slide-in" style={{ padding: '20px' }}>
      {/* Host Crown */}
      {player.isHost && (
        <Crown 
          size={20} 
          style={{ 
            position: 'absolute', 
            top: '-8px', 
            right: '-8px', 
            color: gameColors.accent.warning,
            backgroundColor: gameColors.cardBg,
            borderRadius: '50%',
            padding: '4px'
          }} 
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${gameColors.accent.primary}, ${gameColors.accent.purple})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: gameColors.textPrimary,
              fontWeight: '600',
              fontSize: '18px'
            }}
          >
            {player.name[0]}
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
              backgroundColor: player.status === 'online' ? gameColors.online : 
                              player.status === 'away' ? gameColors.away : gameColors.offline,
              border: `2px solid ${gameColors.cardBg}`
            }}
          />
        </div>

        <div>
          <div style={{ color: gameColors.textPrimary, fontWeight: '600', marginBottom: '4px' }}>
            {player.name}
          </div>
          <div style={{ color: gameColors.textMuted, fontSize: '14px' }}>
            {player.role !== 'unknown' ? (
              <span style={{ 
                color: player.role === 'citizen' ? gameColors.accent.success : gameColors.accent.danger,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {player.role === 'citizen' ? <Shield size={12} /> : <Target size={12} />}
                {player.role === 'citizen' ? '시민' : '라이어'}
              </span>
            ) : (
              <span style={{ color: gameColors.textMuted }}>미확인</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {player.hasVoted ? (
            <span style={{ color: gameColors.accent.success, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={16} />
              투표 완료
            </span>
          ) : (
            <span style={{ color: gameColors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={16} />
              대기 중
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {player.votesReceived > 0 && (
            <span
              style={{
                backgroundColor: `${gameColors.accent.danger}30`,
                color: gameColors.accent.danger,
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {player.votesReceived} 표
            </span>
          )}
          <span
            style={{
              color: player.isAlive ? gameColors.accent.success : gameColors.accent.danger,
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {player.isAlive ? '생존' : '제거됨'}
          </span>
        </div>
      </div>
    </div>
  );

  // 네비게이션 섹션
  const sections = [
    { id: 'overview', name: 'Overview', icon: BarChart3, description: '게임 개요 및 현재 상태' },
    { id: 'components', name: 'Components', icon: Monitor, description: 'UI 컴포넌트 라이브러리' },
    { id: 'players', name: 'Players', icon: Users, description: '플레이어 카드 및 역할 표시' }
  ];

  // 섹션 렌더링 함수들
  const renderOverview = () => (
    <div style={{ display: 'grid', gap: '32px' }}>
      <GameCard title="실시간 게임 대시보드">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px', background: `${gameColors.accent.primary}20`, borderRadius: '12px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: gameColors.accent.primary, marginBottom: '8px' }}>
              {gameState.round}
            </div>
            <div style={{ color: gameColors.textMuted }}>라운드</div>
          </div>

          <div style={{ textAlign: 'center', padding: '20px', background: `${gameColors.accent.warning}20`, borderRadius: '12px' }}>
            <div 
              style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: gameState.timeLeft <= 10 ? gameColors.accent.danger : gameColors.accent.warning,
                marginBottom: '8px'
              }}
              className={gameState.timeLeft <= 10 ? 'animate-pulse' : ''}
            >
              {formatTime(gameState.timeLeft)}
            </div>
            <div style={{ color: gameColors.textMuted }}>남은 시간</div>
          </div>

          <div style={{ textAlign: 'center', padding: '20px', background: `${gameColors.accent.success}20`, borderRadius: '12px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: gameColors.accent.success, marginBottom: '8px' }}>
              {players.filter(p => p.isAlive).length}
            </div>
            <div style={{ color: gameColors.textMuted }}>생존자</div>
          </div>

          <div style={{ textAlign: 'center', padding: '20px', background: `${gameColors.accent.purple}20`, borderRadius: '12px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: gameColors.accent.purple, marginBottom: '8px' }}>
              {players.filter(p => p.hasVoted).length}/{players.filter(p => p.isAlive).length}
            </div>
            <div style={{ color: gameColors.textMuted }}>투표 진행</div>
          </div>
        </div>
      </GameCard>

      <GameCard title="게임 페이즈 및 진행률">
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span 
              style={{ 
                backgroundColor: gameState.phase === 'voting' ? `${gameColors.accent.danger}30` : `${gameColors.accent.primary}30`,
                color: gameState.phase === 'voting' ? gameColors.accent.danger : gameColors.accent.primary,
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              {gameState.phase === 'discussion' ? '토론 시간' :
               gameState.phase === 'voting' ? '투표 시간' :
               gameState.phase === 'defense' ? '변론 시간' :
               gameState.phase === 'result' ? '결과 발표' : '대기실'}
            </span>
            <span style={{ color: gameColors.textSecondary, fontWeight: '600' }}>
              주제: {gameState.topic}
            </span>
          </div>
          <ProgressBar 
            value={(45 - gameState.timeLeft) / 45 * 100} 
            variant={gameState.timeLeft <= 10 ? 'danger' : 'primary'}
          />
        </div>
      </GameCard>
    </div>
  );

  const renderPlayers = () => (
    <div style={{ display: 'grid', gap: '24px' }}>
      <GameCard title="플레이어 목록">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {players.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </GameCard>
    </div>
  );

  const renderComponents = () => (
    <div style={{ display: 'grid', gap: '24px' }}>
      <GameCard title="게임 버튼 컴포넌트">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <GameButton variant="primary" icon={Play}>Primary</GameButton>
          <GameButton variant="secondary" icon={Settings}>Secondary</GameButton>
          <GameButton variant="danger" icon={Target}>Danger</GameButton>
          <GameButton variant="success" icon={Check}>Success</GameButton>
        </div>
      </GameCard>

      <GameCard title="프로그레스 바">
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <div style={{ color: gameColors.textSecondary, marginBottom: '8px' }}>게임 진행률 - 75%</div>
            <ProgressBar value={75} variant="primary" />
          </div>
          <div>
            <div style={{ color: gameColors.textSecondary, marginBottom: '8px' }}>투표 참여율 - 60%</div>
            <ProgressBar value={60} variant="success" />
          </div>
          <div>
            <div style={{ color: gameColors.textSecondary, marginBottom: '8px' }}>위험 수준 - 90%</div>
            <ProgressBar value={90} variant="danger" />
          </div>
        </div>
      </GameCard>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'components': return renderComponents();
      case 'players': return renderPlayers();
      default: return renderOverview();
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: gameStyles }} />
      <div className="game-demo-container">
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* 사이드바 */}
          <aside
            style={{
              width: '320px',
              backgroundColor: gameColors.cardBg,
              borderRight: `2px solid ${gameColors.cardBorder}`,
              display: 'flex',
              flexDirection: 'column',
              position: 'sticky',
              top: 0,
              height: '100vh'
            }}
          >
            {/* 헤더 */}
            <div style={{ padding: '24px', borderBottom: `2px solid ${gameColors.cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${gameColors.accent.primary}, ${gameColors.accent.purple})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Zap size={24} color={gameColors.textPrimary} />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>라이어 게임</h1>
                  <p style={{ margin: 0, color: gameColors.textMuted, fontSize: '14px' }}>UI/UX 통합 데모</p>
                </div>
              </div>

              {/* 게임 상태 요약 */}
              <div
                style={{
                  backgroundColor: `${gameColors.accent.primary}20`,
                  border: `2px solid ${gameColors.accent.primary}40`,
                  borderRadius: '12px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: gameColors.textSecondary }}>페이즈</span>
                  <span style={{ color: gameColors.accent.primary, fontWeight: '600' }}>
                    {gameState.phase === 'discussion' ? '토론' :
                     gameState.phase === 'voting' ? '투표' : '게임'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: gameColors.textSecondary }}>시간</span>
                  <span 
                    style={{ 
                      color: gameState.timeLeft <= 10 ? gameColors.accent.danger : gameColors.textPrimary,
                      fontFamily: 'monospace',
                      fontWeight: 'bold'
                    }}
                  >
                    {formatTime(gameState.timeLeft)}
                  </span>
                </div>
                <ProgressBar 
                  value={(45 - gameState.timeLeft) / 45 * 100}
                  variant={gameState.timeLeft <= 10 ? 'danger' : 'primary'}
                />
              </div>
            </div>

            {/* 네비게이션 */}
            <nav style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                {sections.map(section => {
                  const IconComponent = section.icon;
                  const isActive = activeSection === section.id;
                  
                  return (
                    <button
                      key={section.id}
                      className="game-button"
                      style={{
                        width: '100%',
                        padding: '16px',
                        textAlign: 'left',
                        backgroundColor: isActive ? `${gameColors.accent.primary}30` : 'transparent',
                        color: isActive ? gameColors.accent.primary : gameColors.textSecondary,
                        border: isActive ? `2px solid ${gameColors.accent.primary}60` : '2px solid transparent',
                        borderRadius: '12px',
                        justifyContent: 'flex-start'
                      }}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <IconComponent size={20} />
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                            {section.name}
                          </div>
                          <div style={{ fontSize: '12px', color: gameColors.textMuted }}>
                            {section.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* 푸터 */}
            <div style={{ padding: '16px', borderTop: `2px solid ${gameColors.cardBorder}`, textAlign: 'center' }}>
              <div style={{ color: gameColors.textMuted, fontSize: '12px' }}>
                라이어 게임 v2.0 • UI/UX Enhanced
              </div>
            </div>
          </aside>

          {/* 메인 콘텐츠 */}
          <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              {/* 섹션 헤더 */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div
                    style={{
                      padding: '8px',
                      backgroundColor: `${gameColors.accent.primary}30`,
                      borderRadius: '8px'
                    }}
                  >
                    {React.createElement(sections.find(s => s.id === activeSection)?.icon || Activity, {
                      size: 24,
                      color: gameColors.accent.primary
                    })}
                  </div>
                  <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>
                    {sections.find(s => s.id === activeSection)?.name}
                  </h2>
                </div>
                <p style={{ margin: 0, color: gameColors.textSecondary, fontSize: '16px' }}>
                  {sections.find(s => s.id === activeSection)?.description}
                </p>
              </div>

              {/* 콘텐츠 */}
              <div className="animate-slide-in">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default IntegratedGameDemo;