import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {AnimatePresence, motion} from 'framer-motion'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Textarea} from '@/components/ui/textarea'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {ScrollArea} from '@/components/ui/scroll-area'
import {CheckCircle, Eye, EyeOff, LogOut, MessageCircle, Shield, Target, Users} from 'lucide-react'
import {useGameStore} from '@/store/gameStore'
import {useGameStatus, useSubmitAnswer, useVote} from '@/hooks/useGameQueries'
import {useToast} from '@/hooks/useToast'
import type {Player} from '../components'
import {CompactTimer, DefenseTimer, DiscussionTimer, GamePlayerCard} from '../components'
import {VotingPanel} from '@/components/game/VotingPanel/VotingPanel'
import {useVotingStatus} from '@/hooks/useRealtime'
import {VotingStatusPanel} from '@/components/game/StatusPanels/VotingStatusPanel'

type GamePhase = 'topic' | 'discussion' | 'voting' | 'defense' | 'results'

export function MainGamePage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    gameId,
    players,
    currentPlayer,
    currentRound,
    totalRounds,
    timeLimit,
    currentTopic,
    currentLiar,
    userVote,
    setUserVote
  } = useGameStore()

  const [localPhase, setLocalPhase] = useState<GamePhase>('topic')
  const [timeRemaining, setTimeRemaining] = useState(120)
  const [selectedVote, setSelectedVote] = useState('')
  const [defenseAnswer, setDefenseAnswer] = useState('')
  const [showTopicDialog, setShowTopicDialog] = useState(true)

  // 투표 현황 (roomId가 숫자인 경우만 폴링)
  const gameNumberParam = roomId && !isNaN(Number(roomId)) ? Number(roomId) : null
  const { data: votingStatus } = useVotingStatus(gameNumberParam)

  // Mock data for demo
  const mockTopic = currentTopic || '동물'
  const mockPlayers: Player[] = [
    {
      id: '1',
      nickname: '나',
      isHost: false,
      isReady: true,
      isOnline: true,
      isCurrentUser: true,
      hasVoted: !!userVote
    },
    {
      id: '2',
      nickname: 'Alice',
      isHost: true,
      isReady: true,
      isOnline: true,
      hasVoted: localPhase === 'voting'
    },
    {
      id: '3',
      nickname: 'Bob',
      isHost: false,
      isReady: true,
      isOnline: true,
      hasVoted: false
    },
    {
      id: '4',
      nickname: 'Charlie',
      isHost: false,
      isReady: true,
      isOnline: true,
      hasVoted: localPhase === 'voting'
    }
  ]

  const currentPlayers = players.length > 0 ? players : mockPlayers
  const isLiar = currentLiar === currentPlayer?.id

  const { } = useGameStatus(gameId)
  const voteMutation = useVote()
  const submitAnswerMutation = useSubmitAnswer()

  // Phase management
  useEffect(() => {
    // Auto-advance phases for demo
    let phaseTimer: NodeJS.Timeout

    if (localPhase === 'topic') {
      phaseTimer = setTimeout(() => {
        setShowTopicDialog(false)
        setLocalPhase('discussion')
        setTimeRemaining(timeLimit)
      }, 3000)
    } else if (localPhase === 'discussion' && timeRemaining <= 0) {
      setLocalPhase('voting')
      setTimeRemaining(60)
    } else if (localPhase === 'voting' && timeRemaining <= 0) {
      if (isLiar) {
        setLocalPhase('defense')
        setTimeRemaining(30)
      } else {
        setLocalPhase('results')
      }
    } else if (localPhase === 'defense' && timeRemaining <= 0) {
      setLocalPhase('results')
    }

    return () => {
      if (phaseTimer) clearTimeout(phaseTimer)
    }
  }, [localPhase, timeRemaining, timeLimit, isLiar])

  const handleTimeUp = () => {
    setTimeRemaining(0)
  }

  const handleTimeTick = (time: number) => {
    setTimeRemaining(time)
  }

  const handleVote = (playerId: string) => {
    setSelectedVote(playerId)
  }

  const handleConfirmVote = async () => {
    try {
      await voteMutation.mutateAsync({ suspectedLiarId: selectedVote })
      setUserVote(selectedVote)
      toast({
        title: '투표가 제출되었습니다!',
        description: '다른 플레이어의 투표를 기다리는 중입니다.'
      })
    } catch (error: any) {
      toast({
        title: '투표 제출 실패',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleSubmitDefense = async () => {
    if (!defenseAnswer.trim()) {
      toast({
        title: '답변을 입력해주세요',
        description: '주제가 무엇이었는지 추측을 입력해야 합니다.',
        variant: 'destructive'
      })
      return
    }

    try {
      await submitAnswerMutation.mutateAsync({ answer: defenseAnswer })
      toast({
        title: '답변이 제출되었습니다!',
        description: '변명이 기록되었습니다.'
      })
      setLocalPhase('results')
    } catch (error: any) {
      toast({
        title: '답변 제출 실패',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleNextRound = () => {
    // Reset for next round
    setLocalPhase('topic')
    setSelectedVote('')
    setDefenseAnswer('')
    setShowTopicDialog(true)
    setUserVote('')
  }

  const handleEndGame = () => {
    navigate(`/results/${roomId}`)
  }

  const handleLeaveGame = () => {
    navigate('/lobby')
    toast({
      title: '게임에서 나감',
      description: '게임에서 나갔습니다'
    })
  }

  const getPhaseTitle = () => {
    switch (localPhase) {
      case 'topic':
        return '주제를 확인하는 중...'
      case 'discussion':
        return '토론 단계'
      case 'voting':
        return '투표 단계'
      case 'defense':
        return '변명 단계'
      case 'results':
        return '라운드 결과'
      default:
        return '게임'
    }
  }

  const getPhaseDescription = () => {
    switch (localPhase) {
      case 'topic':
        return '곧 당신의 주제가 공개됩니다!'
      case 'discussion':
        return isLiar 
          ? '자연스럽게 섞이세요! 대화를 들으며 주제가 무엇인지 파악해 보세요.'
          : '주제에 대해 자연스럽게 이야기하며 누가 라이어인지 찾아보세요.'
      case 'voting':
        return '이제 투표 시간입니다! 누가 라이어라고 생각하나요?'
      case 'defense':
        return '라이어의 기회! 점수를 얻기 위해 주제를 맞혀 보세요.'
      case 'results':
        return '이번 라운드에서 모두가 어떻게 했는지 확인해 봅시다.'
      default:
        return ''
    }
  }

  const getPhaseBadgeLabel = () => {
    switch (localPhase) {
      case 'topic':
        return '주제'
      case 'discussion':
        return '토론'
      case 'voting':
        return '투표'
      case 'defense':
        return '변명'
      case 'results':
        return '결과'
      default:
        return ''
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Game Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 text-center space-y-3 p-4 border-b"
      >
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            라운드 {currentRound || 1} / {totalRounds}
          </span>
          <span className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            {currentPlayers.length}명 플레이어
          </span>
        </div>

        {/* 투표 현황 패널 (옵션) */}
        {votingStatus && (
          <div className="max-w-3xl mx-auto">
            <VotingStatusPanel status={votingStatus} />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold">{getPhaseTitle()}</h1>
            <Badge variant="outline">{getPhaseBadgeLabel()}</Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            {getPhaseDescription()}
          </p>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Primary Game Content - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">

              {/* Topic Reveal Dialog */}
              <Dialog open={showTopicDialog && localPhase === 'topic'}>
                <DialogContent className="max-w-md">
                  <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl">
                      {isLiar ? '당신은 라이어입니다!' : '당신의 주제'}
                    </DialogTitle>
                    <DialogDescription>
                      {isLiar 
                        ? '자연스럽게 섞이며 대화를 들으면서 주제가 무엇인지 파악해 보세요.'
                        : '이 주제에 대해 자연스럽게 이야기하세요. 너무 노골적이지 않게!'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="text-center space-y-4">
                    <div className={`p-6 rounded-lg text-4xl font-bold ${
                      isLiar 
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {isLiar ? '라이어' : mockTopic}
                    </div>

                    {isLiar && (
                      <Alert>
                        <Target className="h-4 w-4" />
                        <AlertDescription>
                          대화를 잘 듣고 주제를 파악하세요. 나중에 맞힐 기회가 있어요!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Phase Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={localPhase}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
          {/* Discussion Phase */}
          {localPhase === 'discussion' && (
            <div className="space-y-6">
              {/* Timer */}
              <DiscussionTimer
                duration={timeLimit}
                onTimeUp={handleTimeUp}
                onTick={handleTimeTick}
                className="max-w-md mx-auto"
              />

              {/* Discussion Instructions */}
              <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">토론 시간!</CardTitle>
                  <CardDescription>
                    {isLiar 
                      ? '대화를 주의 깊게 듣고 주제가 무엇인지 파악해 보세요. 자연스럽게 섞이세요!'
                      : '다른 플레이어들과 주제에 대해 이야기하세요. 누가 주제를 모르는지 찾아보세요!'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="bg-muted/30 rounded-lg p-6">
                    <MessageCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      오른쪽 채팅을 사용해 다른 플레이어와 소통하세요.<br/>
                      {isLiar ? '목표: 주제를 파악하고 들키지 마세요!' : '목표: 라이어를 찾아내세요!'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Voting Phase */}
          {localPhase === 'voting' && (
            <VotingPanel
              players={currentPlayers}
              currentUserId="1"
              phase="voting"
              selectedPlayerId={selectedVote}
              onPlayerSelect={handleVote}
              onVoteSubmit={handleConfirmVote}
              timeRemaining={timeRemaining}
              totalTime={60}
              hasVoted={!!userVote}
            />
          )}

          {/* Defense Phase */}
          {localPhase === 'defense' && isLiar && (
            <div className="space-y-6">
              {/* Timer */}
              <DefenseTimer
                duration={30}
                onTimeUp={handleTimeUp}
                onTick={handleTimeTick}
                className="max-w-md mx-auto"
              />

              <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mx-auto mb-2">
                    <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <CardTitle>라이어의 변명</CardTitle>
                  <CardDescription>
                    정체가 들켰습니다! 점수를 얻기 위해 주제를 맞혀 보세요.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="주제가 무엇이었는지 추측해 보세요"
                    value={defenseAnswer}
                    onChange={(e) => setDefenseAnswer(e.target.value)}
                    className="min-h-24"
                  />
                  <Button
                    onClick={handleSubmitDefense}
                    disabled={submitAnswerMutation.isPending || !defenseAnswer.trim()}
                    className="w-full"
                  >
                    {submitAnswerMutation.isPending ? '제출 중...' : '답변 제출'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Waiting for Defense Phase (non-liars) */}
          {localPhase === 'defense' && !isLiar && (
            <div className="text-center space-y-6">
              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">변명 단계</h3>
                  <p className="text-muted-foreground">
                    라이어가 변명을 제출하는 중입니다. 잠시만 기다려주세요.
                  </p>
                  <CompactTimer
                    duration={30}
                    onTimeUp={handleTimeUp}
                    className="mt-4"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Phase */}
          {localPhase === 'results' && (
            <div className="space-y-6">
              <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-2xl">라운드 종료!</CardTitle>
                  <CardDescription>
                    이번 라운드 결과입니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div>
                    <p className="text-lg mb-2">
                      라이어: <strong>Bob</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      주제: <span className="font-medium">{mockTopic}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">3</div>
                      <div className="text-sm text-muted-foreground">정답 투표</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">1</div>
                      <div className="text-sm text-muted-foreground">오답 투표</div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    {currentRound < totalRounds ? (
                      <Button onClick={handleNextRound}>
                        다음 라운드
                      </Button>
                    ) : (
                      <Button onClick={handleEndGame}>
                        최종 결과 보기
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleLeaveGame}>
                      <LogOut className="h-4 w-4 mr-2" />
                      게임 나가기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
                </motion.div>
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Sidebar - Topic, Players and Chat */}
        <div className="w-80 border-l flex flex-col shrink-0">
          {/* Topic Display - Always visible at top */}
          <div className="shrink-0 p-4 border-b">
            {localPhase === 'discussion' && !isLiar && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">나의 주제</span>
                  </div>
                  <div className="text-xl font-bold text-primary">{mockTopic}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    자연스럽게 대화하세요!
                  </p>
                </CardContent>
              </Card>
            )}
            {localPhase === 'discussion' && isLiar && (
              <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <EyeOff className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">당신은 라이어입니다</span>
                  </div>
                  <div className="text-lg font-bold text-red-700 dark:text-red-300">잘 듣고 자연스럽게 섞이세요</div>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    주제를 파악하세요!
                  </p>
                </CardContent>
              </Card>
            )}
            {(localPhase === 'voting' || localPhase === 'defense' || localPhase === 'results') && (
              <Card className="bg-muted/30">
                <CardContent className="p-4 text-center">
                  <div className="text-sm font-medium text-muted-foreground mb-1">주제는 다음이었습니다</div>
                  <div className="text-lg font-bold">{mockTopic}</div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat Area - Much larger, taking most space */}
          <div className="flex-1 border-b">
            <Card className="m-4 mb-2 h-full flex flex-col">
              <CardHeader className="pb-2 shrink-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="h-5 w-5" />
                  토론 채팅
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-3">
                <ScrollArea className="h-full">
                  <div className="space-y-2 text-sm">
                    <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium mb-2">실시간 토론</p>
                      <p className="text-xs">
                        플레이어들이 여기서 대화합니다.<br/>
                        채팅 연동은 곧 제공될 예정입니다.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Players Section - Compact at bottom */}
          <div className="h-48 overflow-hidden">
            <ScrollArea className="h-full">
              <Card className="m-4 mt-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    플레이어 ({currentPlayers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-1 gap-2">
                    <AnimatePresence>
                      {currentPlayers.map((player) => (
                        <motion.div
                          key={player.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <GamePlayerCard player={player} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}