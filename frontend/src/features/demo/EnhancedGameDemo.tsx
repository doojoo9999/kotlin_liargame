import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Activity,
    BarChart3,
    Gamepad2,
    HelpCircle,
    MessageSquare,
    Monitor,
    Moon,
    Sun,
    Trophy,
    Users,
    Volume2,
    VolumeX,
    Zap
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Toast from '@radix-ui/react-toast';
import {FixedSizeList as List} from 'react-window';

// Import our enhanced components and hooks
import {DemoErrorBoundary} from './components/DemoErrorBoundary';
import {ConnectionStatus, GameButton, GameCard, PlayerCard, ProgressBar} from './components/AccessibleComponents';
import {DemoLoadingOverlay} from './components/LoadingSkeleton';
import {useGameState} from './hooks/useGameState';
import {useGameTimer} from './hooks/useGameTimer';
import {createGameTheme, createThemeVariables, globalStyles} from './styles/theme';
import {Achievement, ChatMessage, Player} from './types';

// Enhanced sample data with more realistic scenarios
const SAMPLE_PLAYERS: Player[] = [
  { 
    id: '1', 
    name: 'Alex', 
    role: 'citizen', 
    status: 'online', 
    isAlive: true, 
    hasVoted: false, 
    votesReceived: 0, 
    isHost: true,
    connectionQuality: 'good'
  },
  { 
    id: '2', 
    name: 'Sarah', 
    role: 'unknown', 
    status: 'online', 
    isAlive: true, 
    hasVoted: true, 
    votesReceived: 2,
    connectionQuality: 'good'
  },
  { 
    id: '3', 
    name: 'Mike', 
    role: 'liar', 
    status: 'away', 
    isAlive: true, 
    hasVoted: false, 
    votesReceived: 1,
    connectionQuality: 'fair'
  },
  { 
    id: '4', 
    name: 'Emma', 
    role: 'citizen', 
    status: 'online', 
    isAlive: false, 
    hasVoted: true, 
    votesReceived: 0,
    connectionQuality: 'good'
  },
  { 
    id: '5', 
    name: 'David', 
    role: 'unknown', 
    status: 'online', 
    isAlive: true, 
    hasVoted: true, 
    votesReceived: 0,
    connectionQuality: 'poor'
  },
  { 
    id: '6', 
    name: 'Lisa', 
    role: 'unknown', 
    status: 'offline', 
    isAlive: true, 
    hasVoted: false, 
    votesReceived: 0,
    connectionQuality: 'good'
  },
  { 
    id: '7', 
    name: 'James', 
    role: 'citizen', 
    status: 'online', 
    isAlive: true, 
    hasVoted: false, 
    votesReceived: 1,
    connectionQuality: 'good'
  },
  { 
    id: '8', 
    name: 'Sophie', 
    role: 'unknown', 
    status: 'online', 
    isAlive: true, 
    hasVoted: true, 
    votesReceived: 0,
    connectionQuality: 'fair'
  }
];

const SAMPLE_CHAT: ChatMessage[] = [
  { 
    id: '1', 
    author: 'Alex', 
    content: '사과는 빨간 과일이죠!', 
    timestamp: new Date('2024-01-01T14:32:00'), 
    type: 'user' 
  },
  { 
    id: '2', 
    author: 'Sarah', 
    content: '토마토도 빨간색이에요', 
    timestamp: new Date('2024-01-01T14:33:00'), 
    type: 'user' 
  },
  { 
    id: '3', 
    author: 'System', 
    content: '투표 시간이 1분 남았습니다.', 
    timestamp: new Date('2024-01-01T14:34:00'), 
    type: 'system' 
  },
  { 
    id: '4', 
    author: 'Mike', 
    content: '딸기가 제일 대표적인 것 같은데...', 
    timestamp: new Date('2024-01-01T14:35:00'), 
    type: 'user' 
  },
  { 
    id: '5', 
    author: 'Emma', 
    content: '수박은 어떤가요?', 
    timestamp: new Date('2024-01-01T14:36:00'), 
    type: 'user' 
  }
];

const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    title: '첫 게임',
    description: '첫 번째 게임을 완주하세요',
    icon: '🎮',
    unlocked: true,
    progress: 1,
    maxProgress: 1
  },
  {
    id: '2',
    title: '라이어 헌터',
    description: '라이어를 5번 찾아내세요',
    icon: '🕵️',
    unlocked: false,
    progress: 2,
    maxProgress: 5
  },
  {
    id: '3',
    title: '마스터 블러프',
    description: '라이어로서 3번 승리하세요',
    icon: '🎭',
    unlocked: false,
    progress: 0,
    maxProgress: 3
  }
];

export const EnhancedGameDemo: React.FC = () => {
  // State management
  const [activeSection, setActiveSection] = useState('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isVotingMode, setIsVotingMode] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Enhanced game state with our custom hooks
  const {
    gameState,
    players,
    gameStats,
    error,
    updateGameState,
    updatePlayer,
    voteForPlayer,
    setConnectionStatus,
    clearError
  } = useGameState({
    initialPlayers: SAMPLE_PLAYERS,
    initialGameState: { 
      phase: 'discussion', 
      timeLeft: 45, 
      round: 1, 
      topic: '빨간 과일',
      maxTime: 45 
    }
  });

  // Enhanced timer with callbacks (memoized to prevent recreation)
  const timerCallbacks = useMemo(() => ({
    onTimeUp: () => {
      setToastMessage('시간이 종료되었습니다!');
      if (soundEnabled) {
        // Play sound effect
        const audio = new Audio('/sounds/timer-end.mp3');
        audio.play().catch(() => {}); // Fail silently if no audio file
      }
    },
    onWarning: (timeLeft: number) => {
      if (timeLeft === 10) {
        setToastMessage('10초 남았습니다!');
      }
    }
  }), [soundEnabled]);

  const timer = useGameTimer({
    initialTime: gameState.timeLeft,
    onTimeUp: timerCallbacks.onTimeUp,
    onWarning: timerCallbacks.onWarning,
    warningThreshold: 10
  });

  // Window resize handler for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simulate connection issues (disabled for better performance)
  // useEffect(() => {
  //   const connectionSimulator = setInterval(() => {
  //     if (Math.random() < 0.1) { // 10% chance of connection issue
  //       setIsConnected(false);
  //       setTimeout(() => setIsConnected(true), 2000);
  //     }
  //   }, 10000);

  //   return () => clearInterval(connectionSimulator);
  // }, []);

  // Update connection status
  useEffect(() => {
    setConnectionStatus(isConnected);
  }, [isConnected, setConnectionStatus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      
      switch (e.key) {
        case '1':
          setActiveSection('overview');
          break;
        case '2':
          setActiveSection('players');
          break;
        case '3':
          setActiveSection('components');
          break;
        case 'v':
        case 'V':
          if (!isVotingMode) {
            setIsVotingMode(true);
            setToastMessage('투표 모드가 활성화되었습니다. 플레이어를 클릭하여 투표하세요.');
          }
          break;
        case 'Escape':
          if (isVotingMode) {
            setIsVotingMode(false);
            setToastMessage('투표 모드가 비활성화되었습니다.');
          }
          break;
        case 'h':
        case 'H':
          setIsHelpOpen(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVotingMode]);

  // Memoized theme
  const currentTheme = useMemo(() => createGameTheme(theme), [theme]);

  // Handlers
  const handlePlayerVote = useCallback((playerId: string) => {
    if (!isVotingMode) return;
    
    voteForPlayer('current-user', playerId);
    setSelectedPlayer(playerId);
    setIsVotingMode(false);
    setToastMessage(`${players.find(p => p.id === playerId)?.name}에게 투표했습니다.`);
    
    if (soundEnabled) {
      const audio = new Audio('/sounds/vote.mp3');
      audio.play().catch(() => {});
    }
  }, [isVotingMode, voteForPlayer, players, soundEnabled]);

  const handleThemeToggle = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      setToastMessage(`${newTheme === 'light' ? '라이트' : '다크'} 테마로 변경되었습니다.`);
      return newTheme;
    });
  }, []);

  const handleSoundToggle = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      setToastMessage(`소리가 ${newValue ? '활성화' : '비활성화'}되었습니다.`);
      return newValue;
    });
  }, []);

  // Section definitions with enhanced descriptions
  const sections = [
    { 
      id: 'overview', 
      name: 'Overview', 
      icon: BarChart3, 
      description: '게임 현황 및 실시간 통계',
      shortcut: '1'
    },
    { 
      id: 'players', 
      name: 'Players', 
      icon: Users, 
      description: '플레이어 목록 및 상태 관리',
      shortcut: '2'
    },
    { 
      id: 'components', 
      name: 'Components', 
      icon: Monitor, 
      description: 'UI 컴포넌트 라이브러리',
      shortcut: '3'
    },
    { 
      id: 'achievements', 
      name: 'Achievements', 
      icon: Trophy, 
      description: '업적 및 진행상황',
      shortcut: '4'
    }
  ];

  // Render functions
  const renderOverview = () => (
    <div style={{ display: 'grid', gap: '32px' }}>
      <GameCard 
        title="실시간 게임 대시보드"
        isLoading={isLoading}
        error={error}
        onRetry={clearError}
        ariaLabel="게임 현황 대시보드"
      >
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px' 
        }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            background: 'var(--color-accent-primary)20', 
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--color-accent-primary)40'
          }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: 'var(--color-accent-primary)', 
              marginBottom: '8px' 
            }}>
              {gameState.round}
            </div>
            <div style={{ color: 'var(--color-text-muted)' }}>라운드</div>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            background: 'var(--color-accent-warning)20', 
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--color-accent-warning)40'
          }}>
            <div 
              style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: timer.isCritical ? 'var(--color-accent-danger)' : 'var(--color-accent-warning)',
                marginBottom: '8px',
                fontFamily: 'monospace'
              }}
              className={timer.isCritical ? 'animate-pulse' : ''}
            >
              {timer.formattedTime}
            </div>
            <div style={{ color: 'var(--color-text-muted)' }}>남은 시간</div>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            background: 'var(--color-accent-success)20', 
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--color-accent-success)40'
          }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: 'var(--color-accent-success)', 
              marginBottom: '8px' 
            }}>
              {gameStats.aliveCount}
            </div>
            <div style={{ color: 'var(--color-text-muted)' }}>생존자</div>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            background: 'var(--color-accent-purple)20', 
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--color-accent-purple)40'
          }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: 'var(--color-accent-purple)', 
              marginBottom: '8px' 
            }}>
              {gameStats.votedCount}/{gameStats.aliveCount}
            </div>
            <div style={{ color: 'var(--color-text-muted)' }}>투표 진행</div>
          </div>
        </div>
      </GameCard>

      <GameCard title="게임 진행상황" ariaLabel="게임 페이즈 및 진행률">
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span 
              style={{ 
                backgroundColor: gameState.phase === 'voting' ? 'var(--color-accent-danger)30' : 'var(--color-accent-primary)30',
                color: gameState.phase === 'voting' ? 'var(--color-accent-danger)' : 'var(--color-accent-primary)',
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                fontWeight: '600',
                border: `1px solid ${gameState.phase === 'voting' ? 'var(--color-accent-danger)' : 'var(--color-accent-primary)'}40`
              }}
            >
              {gameState.phase === 'discussion' ? '토론 시간' :
               gameState.phase === 'voting' ? '투표 시간' :
               gameState.phase === 'defense' ? '변론 시간' :
               gameState.phase === 'result' ? '결과 발표' : '대기실'}
            </span>
            <span style={{ color: 'var(--color-text-secondary)', fontWeight: '600' }}>
              주제: <span style={{ color: 'var(--color-accent-cyan)' }}>{gameState.topic}</span>
            </span>
          </div>
          <ProgressBar 
            value={timer.progress}
            variant={timer.isCritical ? 'danger' : timer.isWarning ? 'warning' : 'primary'}
            label="시간 진행률"
            showPercentage
          />
        </div>
      </GameCard>

      {/* Connection Status */}
      <ConnectionStatus 
        isConnected={isConnected}
        onReconnect={() => setIsConnected(true)}
      />
    </div>
  );

  const renderPlayers = () => {
    // Virtualized player list for better performance with large lists
    const PlayerRow = ({ index, style }: { index: number; style: any }) => (
      <div style={{ ...style, padding: '8px 0' }}>
        <PlayerCard 
          player={players[index]} 
          isSelected={selectedPlayer === players[index].id}
          onSelect={setSelectedPlayer}
          onVote={handlePlayerVote}
          isVotingMode={isVotingMode}
          canVote={players[index].isAlive}
        />
      </div>
    );

    return (
      <div style={{ display: 'grid', gap: '24px' }}>
        <GameCard title="플레이어 관리" ariaLabel="플레이어 목록 및 투표">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <GameButton
              variant={isVotingMode ? 'danger' : 'primary'}
              onClick={() => setIsVotingMode(!isVotingMode)}
              tooltip={{
                title: isVotingMode ? '투표 모드 종료' : '투표 모드 시작',
                description: isVotingMode ? 'ESC를 눌러 투표를 취소할 수 있습니다' : '플레이어를 클릭하여 투표하세요',
                shortcut: 'V'
              }}
            >
              {isVotingMode ? '투표 취소' : '투표 시작'}
            </GameButton>
            
            <GameButton
              variant="secondary"
              onClick={() => setShowChat(true)}
              tooltip={{
                title: '채팅 열기',
                description: '다른 플레이어들과 채팅하세요'
              }}
            >
              <MessageSquare size={16} />
              채팅 ({SAMPLE_CHAT.length})
            </GameButton>
          </div>

          {/* Voting progress */}
          <div style={{ marginBottom: '20px' }}>
            <ProgressBar
              value={(gameStats.votedCount / Math.max(1, gameStats.aliveCount)) * 100}
              variant="success"
              label={`투표 진행률 (${gameStats.votedCount}/${gameStats.aliveCount})`}
            />
          </div>

          {/* Player list - use virtualization for large lists */}
          {players.length > 10 ? (
            <div style={{ height: '400px', width: '100%' }}>
              <List
                height={400}
                itemCount={players.length}
                itemSize={140}
                width="100%"
              >
                {PlayerRow}
              </List>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '16px' 
            }}>
              {players.map(player => (
                <PlayerCard 
                  key={player.id}
                  player={player} 
                  isSelected={selectedPlayer === player.id}
                  onSelect={setSelectedPlayer}
                  onVote={handlePlayerVote}
                  isVotingMode={isVotingMode}
                  canVote={player.isAlive}
                />
              ))}
            </div>
          )}
        </GameCard>
      </div>
    );
  };

  const renderComponents = () => (
    <div style={{ display: 'grid', gap: '24px' }}>
      <GameCard title="인터랙티브 컴포넌트">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <GameButton 
            variant="primary"
            tooltip={{ title: 'Primary Button', description: '기본 액션용 버튼입니다' }}
          >
            Primary
          </GameButton>
          <GameButton 
            variant="secondary"
            tooltip={{ title: 'Secondary Button', description: '보조 액션용 버튼입니다' }}
          >
            Secondary
          </GameButton>
          <GameButton 
            variant="danger"
            tooltip={{ title: 'Danger Button', description: '위험한 액션용 버튼입니다' }}
          >
            Danger
          </GameButton>
          <GameButton 
            variant="success"
            tooltip={{ title: 'Success Button', description: '성공/완료 액션용 버튼입니다' }}
          >
            Success
          </GameButton>
          <GameButton 
            variant="primary"
            loading
            tooltip={{ title: 'Loading Button', description: '로딩 상태를 표시합니다' }}
          >
            Loading
          </GameButton>
        </div>
      </GameCard>

      <GameCard title="프로그레스 바 컴포넌트">
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <ProgressBar value={75} variant="primary" label="게임 진행률" showPercentage />
          </div>
          <div>
            <ProgressBar value={60} variant="success" label="투표 참여율" showPercentage />
          </div>
          <div>
            <ProgressBar value={90} variant="danger" label="위험 수준" showPercentage />
          </div>
          <div>
            <ProgressBar value={45} variant="warning" label="시간 경과" showPercentage />
          </div>
        </div>
      </GameCard>

      <GameCard title="테마 및 접근성">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <GameButton
            variant="secondary"
            icon={theme === 'dark' ? Sun : Moon}
            onClick={handleThemeToggle}
            tooltip={{
              title: `${theme === 'dark' ? '라이트' : '다크'} 테마로 변경`,
              description: '테마를 전환하여 다른 색상 조합을 사용하세요'
            }}
          >
            {theme === 'dark' ? '라이트 모드' : '다크 모드'}
          </GameButton>
          
          <GameButton
            variant="secondary"
            icon={soundEnabled ? Volume2 : VolumeX}
            onClick={handleSoundToggle}
            tooltip={{
              title: `소리 ${soundEnabled ? '끄기' : '켜기'}`,
              description: '게임 효과음과 알림음을 제어합니다'
            }}
          >
            {soundEnabled ? '소리 끄기' : '소리 켜기'}
          </GameButton>

          <GameButton
            variant="secondary"
            icon={HelpCircle}
            onClick={() => setIsHelpOpen(true)}
            tooltip={{
              title: '도움말',
              description: '키보드 단축키와 사용법을 확인하세요',
              shortcut: 'H'
            }}
          >
            도움말
          </GameButton>
        </div>
      </GameCard>
    </div>
  );

  const renderAchievements = () => (
    <div style={{ display: 'grid', gap: '24px' }}>
      <GameCard title="업적 시스템" ariaLabel="획득한 업적과 진행상황">
        <div style={{ display: 'grid', gap: '16px' }}>
          {SAMPLE_ACHIEVEMENTS.map(achievement => (
            <div
              key={achievement.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                borderRadius: 'var(--border-radius-md)',
                background: achievement.unlocked ? 'var(--color-accent-success)20' : 'var(--color-card-hover)',
                border: `1px solid ${achievement.unlocked ? 'var(--color-accent-success)' : 'var(--color-card-border)'}`,
                opacity: achievement.unlocked ? 1 : 0.7
              }}
              role="article"
              aria-label={`업적: ${achievement.title}, ${achievement.unlocked ? '완료' : '미완료'}`}
            >
              <div style={{ fontSize: '32px' }}>
                {achievement.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h4 style={{
                    color: achievement.unlocked ? 'var(--color-accent-success)' : 'var(--color-text-primary)',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    {achievement.title}
                  </h4>
                  {achievement.unlocked && (
                    <span style={{
                      color: 'var(--color-accent-success)',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      ✅ 완료
                    </span>
                  )}
                </div>
                <p style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '14px',
                  margin: '0 0 12px 0'
                }}>
                  {achievement.description}
                </p>
                {achievement.maxProgress && achievement.maxProgress > 1 && (
                  <ProgressBar
                    value={(achievement.progress || 0) / achievement.maxProgress * 100}
                    variant={achievement.unlocked ? 'success' : 'primary'}
                    label={`${achievement.progress}/${achievement.maxProgress}`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </GameCard>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'players': return renderPlayers();
      case 'components': return renderComponents();
      case 'achievements': return renderAchievements();
      default: return renderOverview();
    }
  };

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <DemoErrorBoundary>
      <style dangerouslySetInnerHTML={{ 
        __html: `
          ${createThemeVariables(currentTheme)}
          ${globalStyles}
        `
      }} />
      
      <Toast.Provider swipeDirection="right">
        <div className="game-demo-container">
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Mobile overlay */}
            {isMobile && sidebarOpen && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 999
                }}
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <aside
              style={{
                width: isMobile ? '280px' : '320px',
                backgroundColor: 'var(--color-card-bg)',
                borderRight: '2px solid var(--color-card-border)',
                display: 'flex',
                flexDirection: 'column',
                position: isMobile ? 'fixed' : 'sticky',
                top: 0,
                height: '100vh',
                zIndex: isMobile ? 1000 : 'auto',
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease'
              }}
            >
              {/* Header */}
              <div style={{ padding: 'var(--spacing-lg)', borderBottom: '2px solid var(--color-card-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--border-radius-md)',
                      background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-purple))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Zap size={24} color="var(--color-text-primary)" />
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>라이어 게임</h1>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>
                      Enhanced UI/UX Demo
                    </p>
                  </div>
                  {isMobile && (
                    <button
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      aria-label="사이드바 닫기"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Game Status Summary */}
                <div
                  style={{
                    backgroundColor: 'var(--color-accent-primary)20',
                    border: '2px solid var(--color-accent-primary)40',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>페이즈</span>
                    <span style={{ color: 'var(--color-accent-primary)', fontWeight: '600' }}>
                      {gameState.phase === 'discussion' ? '토론' :
                       gameState.phase === 'voting' ? '투표' : '게임'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>시간</span>
                    <span 
                      style={{ 
                        color: timer.isCritical ? 'var(--color-accent-danger)' : 'var(--color-text-primary)',
                        fontFamily: 'monospace',
                        fontWeight: 'bold'
                      }}
                    >
                      {timer.formattedTime}
                    </span>
                  </div>
                  <ProgressBar 
                    value={timer.progress}
                    variant={timer.isCritical ? 'danger' : 'primary'}
                  />
                </div>
              </div>

              {/* Navigation */}
              <nav 
                style={{ flex: 1, padding: '16px', overflowY: 'auto' }}
                role="navigation"
                aria-label="데모 섹션 탐색"
              >
                <div style={{ display: 'grid', gap: '8px' }}>
                  {sections.map(section => {
                    const IconComponent = section.icon;
                    const isActive = activeSection === section.id;
                    
                    return (
                      <GameButton
                        key={section.id}
                        variant={isActive ? 'primary' : 'secondary'}
                        icon={IconComponent}
                        onClick={() => {
                          setActiveSection(section.id);
                          if (isMobile) setSidebarOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '16px',
                          textAlign: 'left',
                          justifyContent: 'flex-start'
                        }}
                        ariaLabel={`${section.name} 섹션으로 이동`}
                        shortcut={section.shortcut}
                        tooltip={{
                          title: section.name,
                          description: section.description,
                          shortcut: section.shortcut
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                              {section.name}
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                              {section.description}
                            </div>
                          </div>
                        </div>
                      </GameButton>
                    );
                  })}
                </div>
              </nav>

              {/* Footer */}
              <div style={{ 
                padding: '16px', 
                borderTop: '2px solid var(--color-card-border)', 
                textAlign: 'center' 
              }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '8px' }}>
                  Enhanced Liar Game v2.1
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={handleThemeToggle}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    aria-label={`${theme === 'dark' ? '라이트' : '다크'} 테마로 변경`}
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                  <button
                    onClick={handleSoundToggle}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    aria-label={`소리 ${soundEnabled ? '끄기' : '켜기'}`}
                  >
                    {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main style={{ 
              flex: 1, 
              padding: isMobile ? '16px' : '32px', 
              overflowY: 'auto',
              marginLeft: isMobile && !sidebarOpen ? 0 : undefined
            }}>
              {/* Mobile menu button */}
              {isMobile && !sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="game-button"
                  style={{
                    position: 'fixed',
                    top: '16px',
                    left: '16px',
                    zIndex: 100,
                    backgroundColor: 'var(--color-card-bg)',
                    border: '2px solid var(--color-card-border)',
                    padding: '12px'
                  }}
                  aria-label="메뉴 열기"
                >
                  <Gamepad2 size={20} />
                </button>
              )}

              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Section Header */}
                <div style={{ marginBottom: '32px', marginTop: isMobile ? '60px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div
                      style={{
                        padding: '8px',
                        backgroundColor: 'var(--color-accent-primary)30',
                        borderRadius: 'var(--border-radius-sm)'
                      }}
                    >
                      {React.createElement(sections.find(s => s.id === activeSection)?.icon || Activity, {
                        size: 24,
                        color: 'var(--color-accent-primary)'
                      })}
                    </div>
                    <h2 style={{ margin: 0, fontSize: isMobile ? '24px' : '32px', fontWeight: 'bold' }}>
                      {sections.find(s => s.id === activeSection)?.name}
                    </h2>
                  </div>
                  <p style={{ 
                    margin: 0, 
                    color: 'var(--color-text-secondary)', 
                    fontSize: isMobile ? '14px' : '16px' 
                  }}>
                    {sections.find(s => s.id === activeSection)?.description}
                  </p>
                </div>

                {/* Content */}
                <div className="animate-slide-in">
                  {renderContent()}
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Loading Overlay */}
        <DemoLoadingOverlay isVisible={isLoading} />

        {/* Help Dialog */}
        <Dialog.Root open={isHelpOpen} onOpenChange={setIsHelpOpen}>
          <Dialog.Portal>
            <Dialog.Overlay
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9999
              }}
            />
            <Dialog.Content
              className="game-card"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90vw',
                maxWidth: '500px',
                maxHeight: '85vh',
                padding: '24px',
                zIndex: 10000,
                overflowY: 'auto'
              }}
            >
              <Dialog.Title style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: 'var(--color-text-primary)'
              }}>
                키보드 단축키 및 도움말
              </Dialog.Title>
              
              <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ color: 'var(--color-accent-primary)', marginBottom: '8px' }}>네비게이션</h4>
                  <div style={{ display: 'grid', gap: '4px', fontSize: '14px' }}>
                    <div>• <kbd>1</kbd> Overview 섹션</div>
                    <div>• <kbd>2</kbd> Players 섹션</div>
                    <div>• <kbd>3</kbd> Components 섹션</div>
                    <div>• <kbd>4</kbd> Achievements 섹션</div>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ color: 'var(--color-accent-primary)', marginBottom: '8px' }}>게임 조작</h4>
                  <div style={{ display: 'grid', gap: '4px', fontSize: '14px' }}>
                    <div>• <kbd>V</kbd> 투표 모드 토글</div>
                    <div>• <kbd>ESC</kbd> 투표 모드 종료</div>
                    <div>• <kbd>H</kbd> 이 도움말 열기</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ color: 'var(--color-accent-primary)', marginBottom: '8px' }}>접근성</h4>
                  <div style={{ display: 'grid', gap: '4px', fontSize: '14px' }}>
                    <div>• <kbd>Tab</kbd> 요소 간 이동</div>
                    <div>• <kbd>Enter</kbd>/<kbd>Space</kbd> 버튼 활성화</div>
                    <div>• 마우스 없이도 모든 기능 사용 가능</div>
                  </div>
                </div>
              </div>

              <Dialog.Close asChild>
                <GameButton variant="primary" style={{ width: '100%' }}>
                  확인
                </GameButton>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Toast Notification */}
        {toastMessage && (
          <Toast.Root
            className="game-card"
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              padding: '16px',
              minWidth: '300px',
              zIndex: 10001
            }}
            open={!!toastMessage}
            onOpenChange={() => setToastMessage(null)}
            duration={3000}
          >
            <Toast.Title style={{ color: 'var(--color-text-primary)', fontWeight: '600' }}>
              알림
            </Toast.Title>
            <Toast.Description style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              {toastMessage}
            </Toast.Description>
          </Toast.Root>
        )}

        <Toast.Viewport />
      </Toast.Provider>
    </DemoErrorBoundary>
  );
};

export default EnhancedGameDemo;