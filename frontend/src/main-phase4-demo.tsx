import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {motion} from 'framer-motion';

// Phase 4 고급 기능 import
import {interactionManager} from './shared/interactions/manager';
import {gameAnimations} from './versions/main/animations/game-specific';
import {adaptiveUIManager} from './versions/main/adaptive/ui-system';
import {useAdvancedGestures} from './versions/main/gestures/recognizer';
import {
    AccessibleButton,
    AccessibleInput,
    AccessibleModal,
    AccessibleTabs
} from './versions/main/accessibility/components';
import {AriaLiveRegion, screenReaderManager} from './versions/main/accessibility/screen-reader';
import {useKeyboardNavigation} from './versions/main/accessibility/keyboard-navigation';
import {EnhancedPlayerCard} from './versions/main/components/enhanced/EnhancedPlayerCard';
import {EnhancedGameBoard} from './versions/main/components/enhanced/EnhancedGameBoard';
import {useRenderingPerformance, VirtualizedPlayerList} from './versions/main/optimization/rendering';
import {useComponentMemory, useMemoryOptimization} from './versions/main/optimization/memory';

// 타입 정의
interface Player {
  id: string;
  nickname: string;
  isAlive: boolean;
  hasVoted: boolean;
  hint?: string;
}

interface GameState {
  phase: 'waiting' | 'playing' | 'voting' | 'ended';
  currentPlayerId?: string;
}

const Phase4Demo: React.FC = () => {
  // 상태 관리
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', nickname: '플레이어1', isAlive: true, hasVoted: false, hint: '빨간색' },
    { id: '2', nickname: '플레이어2', isAlive: true, hasVoted: true },
    { id: '3', nickname: '플레이어3', isAlive: false, hasVoted: false },
    { id: '4', nickname: '라이어', isAlive: true, hasVoted: false }
  ]);

  const [gameState, setGameState] = useState<GameState>({
    phase: 'playing',
    currentPlayerId: '1'
  });

  const [activeTab, setActiveTab] = useState('interactions');
  const [showModal, setShowModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Refs
  const demoRef = useRef<HTMLDivElement>(null);
  const gestureAreaRef = useRef<HTMLDivElement>(null);

  // 고급 기능 훅들
  const keyboardNav = useKeyboardNavigation(demoRef);
  const memoryManager = useMemoryOptimization();
  const componentMemory = useComponentMemory('Phase4Demo');
  const renderingPerf = useRenderingPerformance('Phase4Demo');

  // 제스처 설정
  const gestureState = useAdvancedGestures(gestureAreaRef, {
    swipe: {
      threshold: 100,
      direction: 'horizontal',
      onSwipeLeft: () => {
        screenReaderManager.announceGameEvent('왼쪽으로 스와이프했습니다');
        nextTab();
      },
      onSwipeRight: () => {
        screenReaderManager.announceGameEvent('오른쪽으로 스와이프했습니다');
        prevTab();
      }
    },
    longPress: {
      duration: 1000,
      onLongPress: () => {
        screenReaderManager.announceGameEvent('길게 눌렀습니다. 설정 메뉴를 엽니다');
        setShowModal(true);
      }
    }
  });

  // 적응형 UI 설정
  const layoutConfig = adaptiveUIManager.getLayoutConfig();
  const animationLevel = adaptiveUIManager.getAnimationLevel();

  useEffect(() => {
    // 컴포넌트 마운트 시 알림
    screenReaderManager.announceGameEvent('Phase 4 고급 기능 데모가 로드되었습니다', 'high');

    // 적응형 UI 변화 감지
    const handleAdaptiveChange = (e: CustomEvent) => {
      screenReaderManager.announceGameEvent('UI 설정이 변경되었습니다');
    };

    window.addEventListener('adaptive-ui-change', handleAdaptiveChange as EventListener);

    return () => {
      window.removeEventListener('adaptive-ui-change', handleAdaptiveChange as EventListener);
    };
  }, []);

  // 탭 네비게이션
  const tabs = [
    {
      id: 'interactions',
      label: '마이크로 인터랙션',
      content: <InteractionsDemo />
    },
    {
      id: 'animations',
      label: '고급 애니메이션',
      content: <AnimationsDemo players={players} gameState={gameState} />
    },
    {
      id: 'gestures',
      label: '제스처 인식',
      content: <GesturesDemo gestureState={gestureState} />
    },
    {
      id: 'accessibility',
      label: '접근성',
      content: <AccessibilityDemo />
    },
    {
      id: 'performance',
      label: '성능 최적화',
      content: <PerformanceDemo
        players={players}
        renderingPerf={renderingPerf}
        memoryInfo={memoryManager?.getMemoryInfo()}
      />
    }
  ];

  const nextTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex].id);
  };

  const prevTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    setActiveTab(tabs[prevIndex].id);
  };

  // 플레이어 액션 핸들러
  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayerId(player.id);
    screenReaderManager.announceGameEvent(`${player.nickname}님을 선택했습니다`);
  };

  const handlePlayerVote = (player: Player) => {
    setPlayers(prev => prev.map(p =>
      p.id === player.id ? { ...p, hasVoted: true } : p
    ));
    screenReaderManager.announceGameEvent(`${player.nickname}님에게 투표했습니다`, 'high');
  };

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      nickname: newPlayerName,
      isAlive: true,
      hasVoted: false
    };

    setPlayers(prev => [...prev, newPlayer]);
    setNewPlayerName('');
    setShowModal(false);

    screenReaderManager.announceGameEvent(`${newPlayerName}님이 게임에 참가했습니다`);
  };

  return (
    <div
      ref={demoRef}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4"
      tabIndex={0}
    >
      {/* AriaLive 영역 */}
      <AriaLiveRegion />

      {/* 헤더 */}
      <motion.header
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          🚀 Phase 4: 고급 기능 데모
        </h1>
        <p className="text-lg text-gray-600">
          마이크로 인터랙션, 고급 애니메이션, 접근성, 성능 최적화
        </p>

        {/* 성능 정보 */}
        <div className="mt-4 text-sm text-gray-500">
          렌더링 횟수: {renderingPerf.renderCount} |
          화면 크기: {layoutConfig.gameBoard.layout} |
          애니메이션: {animationLevel}
        </div>
      </motion.header>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto">
        {/* 제스처 영역 표시 */}
        <motion.div
          ref={gestureAreaRef}
          className="mb-6 p-4 bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300"
          whileHover={{ borderColor: '#3b82f6' }}
        >
          <p className="text-center text-gray-600">
            📱 제스처 테스트 영역: 스와이프(탭 변경) | 길게터치(설정)
          </p>
          {gestureState.isPressed && (
            <motion.div
              className="mt-2 text-center text-blue-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              터치 감지됨!
            </motion.div>
          )}
        </motion.div>

        {/* 탭 시스템 */}
        <AccessibleTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="bg-white rounded-lg shadow-lg"
        />

        {/* 플레이어 보드 데모 */}
        <motion.section
          className="mt-8 bg-white rounded-lg shadow-lg p-6"
          layout
        >
          <h2 className="text-2xl font-bold mb-4">통합 게임 보드</h2>

          <EnhancedGameBoard
            players={players}
            gameState={gameState}
            currentPlayer={players.find(p => p.id === gameState.currentPlayerId)}
            onPlayerSelect={handlePlayerSelect}
            onPlayerVote={handlePlayerVote}
            onPlayerAction={(playerId, action) => {
              screenReaderManager.announceGameEvent(`플레이어 액션: ${action}`);
            }}
          />

          <div className="mt-4 flex justify-center space-x-4">
            <AccessibleButton
              onClick={() => setGameState(prev => ({
                ...prev,
                phase: prev.phase === 'voting' ? 'playing' : 'voting'
              }))}
              variant="primary"
            >
              {gameState.phase === 'voting' ? '게임 재개' : '투표 시작'}
            </AccessibleButton>

            <AccessibleButton
              onClick={() => setShowModal(true)}
              variant="secondary"
            >
              플레이어 추가
            </AccessibleButton>
          </div>
        </motion.section>
      </div>

      {/* 플레이어 추가 모달 */}
      <AccessibleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="플레이어 추가"
      >
        <div className="space-y-4">
          <AccessibleInput
            label="플레이어 이름"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="이름을 입력하세요"
            required
          />

          <div className="flex justify-end space-x-2">
            <AccessibleButton
              onClick={() => setShowModal(false)}
              variant="secondary"
            >
              취소
            </AccessibleButton>
            <AccessibleButton
              onClick={handleAddPlayer}
              variant="primary"
              disabled={!newPlayerName.trim()}
            >
              추가
            </AccessibleButton>
          </div>
        </div>
      </AccessibleModal>

      {/* 키보드 단축키 도움말 */}
      <motion.div
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs opacity-75 max-w-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.75, y: 0 }}
        transition={{ delay: 2 }}
      >
        <h4 className="font-bold mb-1">키보드 단축키</h4>
        <ul className="space-y-1">
          <li>Tab: 다음 요소</li>
          <li>방향키: 네비게이션</li>
          <li>Enter: 선택</li>
          <li>V: 투표</li>
          <li>Esc: 취소/닫기</li>
        </ul>
      </motion.div>
    </div>
  );
};

// 개별 데모 컴포넌트들
const InteractionsDemo = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const triggerInteraction = async () => {
    if (!buttonRef.current) return;

    await interactionManager.executeInteraction(buttonRef.current, {
      type: 'click',
      trigger: 'demo',
      animation: gameAnimations.buttonHover,
      sound: 'click',
      haptic: true,
      cooldown: 500
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">마이크로 인터랙션 테스트</h3>
      <AccessibleButton
        ref={buttonRef}
        onClick={triggerInteraction}
        variant="primary"
      >
        인터랙션 테스트 (사운드 + 햅틱 + 애니메이션)
      </AccessibleButton>
    </div>
  );
};

const AnimationsDemo = ({ players, gameState }: { players: Player[], gameState: GameState }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">고급 애니메이션</h3>
      <div className="grid grid-cols-2 gap-4">
        {players.slice(0, 4).map(player => (
          <EnhancedPlayerCard
            key={player.id}
            player={player}
            isCurrentTurn={player.id === gameState.currentPlayerId}
            canVote={gameState.phase === 'voting'}
          />
        ))}
      </div>
    </div>
  );
};

const GesturesDemo = ({ gestureState }: { gestureState: any }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">제스처 인식 상태</h3>
      <div className="bg-gray-100 p-4 rounded">
        <p>터치 상태: {gestureState.isPressed ? '활성' : '비활성'}</p>
        <p>시작 위치: ({gestureState.startPos.x}, {gestureState.startPos.y})</p>
        <p>현재 위치: ({gestureState.currentPos.x}, {gestureState.currentPos.y})</p>
      </div>
    </div>
  );
};

const AccessibilityDemo = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">접근성 기능</h3>
      <ul className="list-disc list-inside space-y-2 text-gray-700">
        <li>WCAG 2.1 AA 수준 준수</li>
        <li>완전한 키보드 네비게이션</li>
        <li>스크린 리더 지원</li>
        <li>고대비 모드 지원</li>
        <li>포커스 트랩 및 aria-live 영역</li>
      </ul>
    </div>
  );
};

const PerformanceDemo = ({
  players,
  renderingPerf,
  memoryInfo
}: {
  players: Player[],
  renderingPerf: any,
  memoryInfo: any
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">성능 최적화</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 p-4 rounded">
          <h4 className="font-medium mb-2">렌더링 정보</h4>
          <p>렌더링 횟수: {renderingPerf.renderCount}</p>
          <p>평균 렌더링 시간: {renderingPerf.getAverageRenderTime().toFixed(2)}ms</p>
        </div>

        {memoryInfo && (
          <div className="bg-gray-100 p-4 rounded">
            <h4 className="font-medium mb-2">메모리 사용량</h4>
            <p>사용: {(memoryInfo.used / 1024 / 1024).toFixed(2)}MB</p>
            <p>전체: {(memoryInfo.total / 1024 / 1024).toFixed(2)}MB</p>
            <p>사용률: {memoryInfo.percentage.toFixed(1)}%</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">가상화된 플레이어 리스트</h4>
        <VirtualizedPlayerList
          players={players}
          onPlayerSelect={(player) => console.log('Selected:', player)}
          height={200}
        />
      </div>
    </div>
  );
};

// 앱 렌더링
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Phase4Demo />);
}
