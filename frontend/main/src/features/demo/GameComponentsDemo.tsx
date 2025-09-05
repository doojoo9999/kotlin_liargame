import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {ChatMessage, GameState, Player, VotingRecord} from '@/shared/types/game';
import {AdvancedPlayerCard} from '../game/components/AdvancedPlayerCard';
import {GameBoard} from '../game/components/GameBoard';
import {VotingPanel} from '../game/components/VotingPanel';
import {ChatSystem} from '../chat/components/ChatSystem';
import {GamePhaseIndicator} from '../game/components/GamePhaseIndicator';
import {VictoryAnimation, VoteParticleEffect} from '@/shared/animations/ParticleEffects';
import {useGameAnimationContext} from '@/shared/hooks/useAnimation';

// 데모용 데이터
const demoPlayers: Player[] = [
  { id: 1, userId: 1, nickname: '플레이어1', isAlive: true, state: 'ACTIVE', votesReceived: 0, hasVoted: false, isHost: true },
  { id: 2, userId: 2, nickname: '플레이어2', isAlive: true, state: 'ACTIVE', votesReceived: 1, hasVoted: true, hint: '빨간색 과일' },
  { id: 3, userId: 3, nickname: '플레이어3', isAlive: true, state: 'SUSPECTED', votesReceived: 2, hasVoted: false },
  { id: 4, userId: 4, nickname: '플레이어4', isAlive: false, state: 'ELIMINATED', votesReceived: 0, hasVoted: false },
  { id: 5, userId: 5, nickname: '플레이어5', isAlive: true, state: 'DEFENDING', votesReceived: 0, hasVoted: true },
  { id: 6, userId: 6, nickname: '플레이어6', isAlive: true, state: 'ACTIVE', votesReceived: 0, hasVoted: true }
];

const demoMessages: ChatMessage[] = [
  {
    id: '1',
    senderId: 1,
    senderNickname: '플레이어1',
    content: '제가 라이어가 아닙니다!',
    type: 'DEFENSE',
    timestamp: new Date(),
    gamePhase: 'DEFENSE'
  },
  {
    id: '2',
    senderId: 2,
    senderNickname: '플레이어2',
    content: '사과가 맞는 것 같아요',
    type: 'DISCUSSION',
    timestamp: new Date(),
    gamePhase: 'DISCUSSION'
  }
];

const phaseConfig = {
  WAITING: { label: '대기 중', description: '게임 시작을 기다리고 있습니다', color: '#6b7280', icon: '⏳' },
  ROLE_ASSIGNMENT: { label: '역할 배정', description: '역할을 확인하세요', color: '#8b5cf6', icon: '🎭' },
  HINT_PROVIDING: { label: '힌트 제공', description: '주제에 대한 힌트를 제공하세요', color: '#3b82f6', icon: '💡' },
  DISCUSSION: { label: '토론', description: '서로의 의견을 나눠보세요', color: '#10b981', icon: '💬' },
  VOTING: { label: '투표', description: '라이어를 지목해주세요', color: '#ef4444', icon: '🗳️' },
  DEFENSE: { label: '변론', description: '자신을 변호할 기회입니다', color: '#f59e0b', icon: '🛡️' },
  FINAL_VOTING: { label: '최종 투표', description: '최종 결정을 내려주세요', color: '#dc2626', icon: '⚖️' },
  RESULT: { label: '결과', description: '게임 결과를 확인하세요', color: '#8b5cf6', icon: '🏆' },
  FINISHED: { label: '게임 종료', description: '게임이 끝났습니다', color: '#6b7280', icon: '🎉' }
};

export const GameComponentsDemo: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    gamePhase: 'VOTING',
    currentTurnIndex: 0,
    currentPlayerId: 1,
    timeRemaining: 45,
    totalTime: 60,
    round: 1,
    maxRounds: 3
  });

  const [players, setPlayers] = useState(demoPlayers);
  const [messages, setMessages] = useState(demoMessages);
  const [votes, setVotes] = useState<VotingRecord[]>([]);
  const [showVictory, setShowVictory] = useState(false);
  const [layout, setLayout] = useState<'circle' | 'grid' | 'adaptive'>('circle');

  const animationConfig = useGameAnimationContext(gameState.gamePhase, players.length, true);

  const handleVote = async (targetId: number) => {
    const newVote: VotingRecord = {
      voterId: 1,
      targetId,
      timestamp: new Date()
    };
    setVotes(prev => [...prev, newVote]);

    // 투표 수 업데이트
    setPlayers(prev => prev.map(player =>
      player.id === targetId
        ? { ...player, votesReceived: player.votesReceived + 1 }
        : player
    ));
  };

  const handleSendMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 1,
      senderNickname: '나',
      content,
      type: 'DISCUSSION',
      timestamp: new Date(),
      gamePhase: gameState.gamePhase
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handlePhaseSkip = () => {
    const phases = Object.keys(phaseConfig);
    const currentIndex = phases.indexOf(gameState.gamePhase);
    const nextIndex = (currentIndex + 1) % phases.length;

    setGameState(prev => ({
      ...prev,
      gamePhase: phases[nextIndex] as any,
      timeRemaining: 60
    }));
  };

  // 타이머 시뮬레이션
  React.useEffect(() => {
    if (gameState.timeRemaining && gameState.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining! - 1
        }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.timeRemaining]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-center mb-8">
          라이어 게임 Main Version - 컴포넌트 데모
        </h1>

        {/* 컨트롤 패널 */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-4">컨트롤 패널</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">레이아웃</label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as any)}
                className="border rounded px-3 py-1"
              >
                <option value="circle">원형</option>
                <option value="grid">그리드</option>
                <option value="adaptive">적응형</option>
              </select>
            </div>
            <button
              onClick={() => setShowVictory(!showVictory)}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              승리 애니메이션 {showVictory ? '숨기기' : '보기'}
            </button>
            <button
              onClick={handlePhaseSkip}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              다음 단계
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 게임 보드와 단계 표시 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 게임 단계 표시 */}
            <GamePhaseIndicator
              currentPhase={gameState.gamePhase}
              phaseConfig={phaseConfig}
              timeRemaining={gameState.timeRemaining}
              totalTime={gameState.totalTime}
              onPhaseSkip={handlePhaseSkip}
              nextPhase={Object.keys(phaseConfig)[(Object.keys(phaseConfig).indexOf(gameState.gamePhase) + 1) % Object.keys(phaseConfig).length] as any}
            />

            {/* 게임 보드 */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">게임 보드</h3>
              <div className="h-96">
                <GameBoard
                  players={players}
                  gameState={gameState}
                  layout={layout}
                  onPlayerAction={(action) => {
                    if (action.type === 'VOTE' && action.targetId) {
                      handleVote(action.targetId);
                    }
                  }}
                  interactive={true}
                />
              </div>
            </div>

            {/* 투표 패널 */}
            {(gameState.gamePhase === 'VOTING' || gameState.gamePhase === 'FINAL_VOTING') && (
              <VotingPanel
                players={players}
                votingType={gameState.gamePhase === 'VOTING' ? 'LIAR_SELECTION' : 'FINAL_SURVIVAL'}
                onVote={handleVote}
                timeRemaining={gameState.timeRemaining}
                currentVotes={votes}
                userVote={votes.find(v => v.voterId === 1)?.targetId}
                disabled={false}
              />
            )}

            {/* 플레이어 카드 개별 데모 */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">플레이어 카드 상태별 데모</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.slice(0, 4).map((player, index) => (
                  <AdvancedPlayerCard
                    key={player.id}
                    player={player}
                    gamePhase={gameState.gamePhase}
                    isCurrentTurn={index === 0}
                    isVotingTarget={index === 2}
                    onVote={handleVote}
                    onViewHint={(hint) => alert(`힌트: ${hint}`)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 채팅 시스템 */}
          <div className="space-y-6">
            <div className="h-96">
              <ChatSystem
                gameNumber={1}
                messages={messages}
                chatType="DISCUSSION"
                onSendMessage={handleSendMessage}
                disabled={false}
                allowedSender="all"
              />
            </div>

            {/* 성능 정보 */}
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-semibold mb-2">애니메이션 성능 정보</h3>
              <div className="text-sm space-y-1">
                <div>Duration: {animationConfig.duration}s</div>
                <div>Ease: {animationConfig.ease}</div>
                <div>Complexity: {animationConfig.complexity}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 승리 애니메이션 */}
        <VictoryAnimation
          winningTeam="CITIZEN"
          isActive={showVictory}
        />

        {/* 파티클 효과 데모 */}
        <VoteParticleEffect
          targetPosition={{ x: 100, y: 100 }}
          isActive={votes.length > 0}
        />
      </motion.div>
    </div>
  );
};
