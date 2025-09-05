import * as React from "react"
import {motion} from "framer-motion"
import {useNavigate, useParams} from "react-router-dom"
import {Eye, EyeOff, Users} from "lucide-react"
import {useMutation, useQuery} from "@tanstack/react-query"
import {GameScreenLayout} from "@/versions/main/components/layout"
import {GameStatus, HintDisplay, PlayerCard, Timer, TurnIndicator, VoteInterface} from "@/versions/main/components/game"
import {RealtimeChatSystem} from "@/versions/main/components/game/RealtimeChatSystem"
import {ConnectionStatus, OfflineIndicator} from "@/versions/main/components/ui/ConnectionStatus"
import {Button} from "@/versions/main/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {useGame} from "@/versions/main/providers/GameProvider"
import {useNotification} from "@/versions/main/providers/NotificationProvider"
import {useGameStateSubscriber} from "@/versions/main/hooks/useGameStateSubscriber"
import type {GamePhase, Player} from "@/shared/types/api.types"

// 게임 액션 타입 정의
interface GameAction {
  action: 'VOTE' | 'HINT_SUBMIT' | 'DEFENSE_SUBMIT' | 'FINAL_GUESS' | 'READY';
  data?: {
    targetPlayerId?: number;
    hint?: string;
    defense?: string;
    subject?: string;
    message?: string;
  };
}

// 게임 상태 타입 정의
interface GameState {
  gameNumber: number;
  phase: GamePhase;
  timeRemaining: number;
  currentRound: number;
  totalRounds: number;
  players: Player[];
  currentPlayerId: number;
  subject?: string;
  isLiar: boolean;
  votingResults?: Record<number, number>;
}

interface GameStageProps {
  gameState: GameState
  currentPlayer: Player
  onAction: (action: string, data?: GameAction['data']) => boolean
}

// 게임 단계별 컴포넌트들
function WaitingStage({ gameState }: GameStageProps) {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">⏳</div>
      <h2 className="text-2xl font-bold">게임 시작 준비 중</h2>
      <p className="text-muted-foreground">
        모든 플레이어가 준비될 때까지 잠시 기다려주세요
      </p>
      <Timer timeRemaining={10} totalTime={10} />
    </div>
  )
}

function RoleAssignmentStage({ gameState, currentPlayer }: GameStageProps) {
  const [showRole, setShowRole] = React.useState(false)

  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">역할이 배정되었습니다</h2>
        <p className="text-muted-foreground">
          당신의 역할을 확인하고 게임을 준비하세요
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          {!showRole ? (
            <div className="space-y-4">
              <div className="text-6xl">🎭</div>
              <Button
                onClick={() => setShowRole(true)}
                variant="game-primary"
                size="lg"
              >
                <Eye className="w-4 h-4 mr-2" />
                역할 확인하기
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className={`text-6xl ${currentPlayer.role === 'LIAR' ? 'animate-pulse' : ''}`}>
                {currentPlayer.role === 'LIAR' ? '🃏' : '👤'}
              </div>
              <div className="space-y-2">
                <Badge
                  variant={currentPlayer.role === 'LIAR' ? "destructive" : "default"}
                  className="text-lg px-4 py-2"
                >
                  {currentPlayer.role === 'LIAR' ? '라이어' : '시민'}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {currentPlayer.role === 'LIAR'
                    ? "다른 플레이어들의 힌트를 듣고 주제어를 추리하세요"
                    : "주제어에 대한 힌트를 제공하세요"
                  }
                </div>
              </div>
              <Button
                onClick={() => setShowRole(false)}
                variant="outline"
                size="sm"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                숨기기
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {gameState.subject && currentPlayer.role !== 'LIAR' && showRole && (
        <Card className="max-w-md mx-auto bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <div className="text-sm text-blue-600 mb-2">주제어</div>
            <div className="text-2xl font-bold text-blue-800">
              {gameState.subject}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function HintProvidingStage({ gameState, currentPlayer, onAction }: GameStageProps) {
  const currentTurnPlayer = gameState.players[gameState.currentTurnIndex]
  const isMyTurn = currentTurnPlayer?.id === currentPlayer.id

  const handleSubmitHint = (hint: string) => {
    onAction('SUBMIT_HINT', { hint })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">힌트 제공 시간</h2>
        <p className="text-muted-foreground">
          {isMyTurn ? "당신의 차례입니다. 힌트를 제공하세요!" : "다른 플레이어의 힌트를 기다리고 있습니다."}
        </p>
      </div>

      <TurnIndicator
        players={gameState.players}
        currentTurnIndex={gameState.currentTurnIndex}
        direction="horizontal"
        showAll={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HintDisplay
          hints={gameState.hints || []}
          currentPlayer={currentPlayer.nickname}
          showTimestamp={true}
          compact={false}
        />

        {isMyTurn && (
          <div className="space-y-4">
            {gameState.subject && currentPlayer.role !== 'LIAR' && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-sm text-blue-600 mb-1">주제어</div>
                  <div className="text-xl font-bold text-blue-800">
                    {gameState.subject}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>힌트 입력</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <textarea
                    placeholder="주제어에 대한 힌트를 입력하세요..."
                    className="w-full p-3 border rounded-lg resize-none h-24"
                    maxLength={100}
                  />
                  <div className="flex justify-between items-center">
                    <Timer timeRemaining={gameState.timeRemaining || 30} totalTime={30} />
                    <Button onClick={() => handleSubmitHint("예시 힌트")} variant="game-primary">
                      힌트 제공
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function VotingStage({ gameState, currentPlayer, onAction }: GameStageProps) {
  const handleVote = (targetId: number) => {
    onAction('CAST_VOTE', { targetId })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">투표 시간</h2>
        <p className="text-muted-foreground">
          라이어라고 생각하는 플레이어에게 투표하세요
        </p>
      </div>

      <VoteInterface
        players={gameState.players}
        currentPlayerId={currentPlayer.id}
        onVote={handleVote}
        votedFor={currentPlayer.votedFor}
        timeRemaining={gameState.timeRemaining}
      />
    </div>
  )
}

function ResultStage({ gameState }: GameStageProps) {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🏆</div>
      <h2 className="text-2xl font-bold">게임 결과</h2>

      {gameState.winner && (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <Badge
              variant={gameState.winner === 'CITIZENS' ? "default" : "destructive"}
              className="text-lg px-4 py-2 mb-4"
            >
              {gameState.winner === 'CITIZENS' ? '시민팀 승리!' : '라이어팀 승리!'}
            </Badge>
            <p className="text-muted-foreground">
              {gameState.actualSubject && `실제 주제어: ${gameState.actualSubject}`}
            </p>
          </CardContent>
        </Card>
      )}

      <Timer timeRemaining={10} totalTime={10} />
    </div>
  )
}

export default function MainGamePlayPage() {
  const { gameNumber } = useParams<{ gameNumber: string }>()
  const navigate = useNavigate()
  const { state, actions } = useGame()
  const { addNotification } = useNotification()

  const currentUserId = 1
  const currentPlayerNickname = "플레이어1"

  const { data: gameState, isLoading } = useQuery({
    queryKey: ['gameState', gameNumber],
    queryFn: async () => {
      return mockGameState
    },
    refetchInterval: 5000,
  })

  const {
    isConnected,
    connectionState,
    latency,
    sendGameAction,
    reconnect
  } = useGameStateSubscriber({
    gameNumber: parseInt(gameNumber || '0'),
    onGameStateUpdate: (newGameState) => {
      actions.setGame(newGameState)
    },
    onPhaseChange: (phase) => {
      actions.updatePhase(phase)
    },
    onPlayerUpdate: (player) => {
      console.log('Player updated:', player)
    },
    onTurnChange: (currentPlayerId) => {
      console.log('Turn changed to:', currentPlayerId)
    }
  })

  const actionMutation = useMutation({
    mutationFn: async ({ action, data }: { action: string; data?: any }) => {
      const success = sendGameAction(action, data)
      if (!success) {
        throw new Error('Failed to send game action')
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    },
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: '액션 성공',
        message: '게임 액션이 처리되었습니다.'
      })
    },
    onError: () => {
      addNotification({
        type: 'error',
        title: '액션 실패',
        message: '게임 액션 처리에 실패했습니다.'
      })
    }
  })

  const currentPlayer = gameState?.players.find(p => p.userId === currentUserId)

  const handleGameAction = (action: string, data?: any) => {
    actionMutation.mutate({ action, data })
    return !actionMutation.isError
  }

  const handleLeaveGame = () => {
    navigate('/main/lobby')
  }

  const renderGameStage = () => {
    if (!gameState || !currentPlayer) return null

    const stageProps = {
      gameState,
      currentPlayer,
      onAction: handleGameAction
    }

    switch (gameState.phase) {
      case 'WAITING':
        return <WaitingStage {...stageProps} />
      case 'ROLE_ASSIGNMENT':
        return <RoleAssignmentStage {...stageProps} />
      case 'HINT_PROVIDING':
        return <HintProvidingStage {...stageProps} />
      case 'VOTING':
        return <VotingStage {...stageProps} />
      case 'RESULT':
        return <ResultStage {...stageProps} />
      default:
        return <div>알 수 없는 게임 단계입니다.</div>
    }
  }

  if (isLoading) {
    return (
      <GameScreenLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>게임 상태를 불러오는 중...</p>
          </div>
        </div>
      </GameScreenLayout>
    )
  }

  if (!gameState) {
    return (
      <GameScreenLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">게임을 찾을 수 없습니다</h2>
          <Button onClick={() => navigate('/main/lobby')}>
            로비로 돌아가기
          </Button>
        </div>
      </GameScreenLayout>
    )
  }

  const sidebar = (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">연결 상태</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ConnectionStatus
            isConnected={isConnected}
            connectionState={connectionState}
            latency={latency}
            onReconnect={reconnect}
          />
        </CardContent>
      </Card>

      <GameStatus
        gamePhase={gameState.phase}
        timeRemaining={gameState.timeRemaining}
        currentRound={gameState.currentRound}
        totalRounds={gameState.totalRounds}
        playersTotal={gameState.players.length}
        playersVoted={gameState.players.filter(p => p.hasVoted).length}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            플레이어 목록
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {gameState.players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentPlayer={player.userId === currentUserId}
              showRole={gameState.phase === 'RESULT'}
              className="w-full"
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )

  const chat = (
    <RealtimeChatSystem
      gameNumber={parseInt(gameNumber || '0')}
      currentPlayerNickname={currentPlayerNickname}
      gamePhase={gameState.phase}
      disabled={!isConnected}
    />
  )

  return (
    <>
      <OfflineIndicator
        isOffline={!isConnected && connectionState !== 'connecting'}
        onReconnect={reconnect}
      />

      <GameScreenLayout
        sidebar={sidebar}
        chat={chat}
        phase={getPhaseLabel(gameState.phase)}
        timeRemaining={gameState.timeRemaining}
        onLeave={handleLeaveGame}
      >
        <div className="h-full flex flex-col">
          <motion.div
            key={gameState.phase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            {renderGameStage()}
          </motion.div>
        </div>
      </GameScreenLayout>
    </>
  )
}

function getPhaseLabel(phase: GamePhase): string {
  const labels: Record<GamePhase, string> = {
    'WAITING': '대기 중',
    'ROLE_ASSIGNMENT': '역할 배정',
    'HINT_PROVIDING': '힌트 제공',
    'DISCUSSION': '토론 시간',
    'VOTING': '투표 시간',
    'DEFENSE': '변론 시간',
    'FINAL_VOTING': '최종 투표',
    'LIAR_GUESS': '라이어 추측',
    'RESULT': '결과 발표',
    'FINISHED': '게임 종료'
  }
  return labels[phase] || phase
}

// 임시 목업 데이터
const mockGameState = {
  gameNumber: 1,
  phase: 'HINT_PROVIDING' as GamePhase,
  currentRound: 1,
  totalRounds: 3,
  timeRemaining: 45,
  currentTurnIndex: 0,
  subject: "강아지",
  players: [
    {
      id: 1,
      userId: 1,
      nickname: "플레이어1",
      isHost: true,
      isAlive: true,
      role: 'CITIZEN' as const,
      joinedAt: new Date().toISOString(),
      votesReceived: 0,
      hasVoted: false,
      hasProvidedHint: false
    },
    {
      id: 2,
      userId: 2,
      nickname: "플레이어2",
      isHost: false,
      isAlive: true,
      role: 'LIAR' as const,
      joinedAt: new Date().toISOString(),
      votesReceived: 0,
      hasVoted: false,
      hasProvidedHint: false
    }
  ],
  hints: [
    {
      id: "1",
      playerId: 1,
      playerNickname: "플레이어1",
      content: "네 발로 걸어다녀요",
      timestamp: new Date(Date.now() - 60000).toISOString(),
      turnIndex: 0
    }
  ]
}
