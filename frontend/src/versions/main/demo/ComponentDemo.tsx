import * as React from "react"
import {motion} from "framer-motion"
import {ArrowLeft, GameController2, MessageSquare, Palette, Users, Vote} from "lucide-react"
import {Card, CardContent, CardHeader, CardTitle} from "../components/ui/card"
import {Button} from "../components/ui/button"
import {Badge} from "../components/ui/badge"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "../components/ui/tabs"
import {PlayerCard} from "../components/game/player-card"
import {GamePhaseIndicator} from "../components/game/game-phase-indicator"
import {VotingPanel} from "../components/game/voting-panel"
import {ChatSystem} from "../components/game/chat-system"
import {CreateGameForm} from "../components/forms/create-game-form"
import {StatusIndicator} from "../components/ui/status-indicator"
import {Progress} from "../components/ui/progress"
import {ChatMessage, GamePhase, Player} from "../../types/game"

// 목 데이터
const mockPlayers: Player[] = [
  {
    id: 1,
    userId: 1,
    nickname: "플레이어1",
    isAlive: true,
    role: "CITIZEN",
    state: "GAVE_HINT",
    hint: "네 다리가 있어요",
    votesReceived: 2,
    hasVoted: true,
    cumulativeScore: 15,
    joinedAt: "2025-01-03T10:00:00Z",
    isCurrentTurn: true
  },
  {
    id: 2,
    userId: 2,
    nickname: "플레이어2",
    isAlive: true,
    role: "LIAR",
    state: "WAITING_FOR_VOTE",
    hint: "털이 있고 귀여워요",
    votesReceived: 1,
    hasVoted: false,
    cumulativeScore: 8,
    joinedAt: "2025-01-03T10:01:00Z"
  },
  {
    id: 3,
    userId: 3,
    nickname: "플레이어3",
    isAlive: false,
    role: "CITIZEN",
    state: "ELIMINATED",
    hint: "꼬리를 흔들어요",
    defense: "저는 라이어가 아닙니다. 제가 말한 힌트를 보세요!",
    votesReceived: 3,
    hasVoted: true,
    cumulativeScore: 12,
    joinedAt: "2025-01-03T10:02:00Z"
  }
]

const mockMessages: ChatMessage[] = [
  {
    id: 1,
    gameNumber: 123,
    playerNickname: "플레이어1",
    content: "안녕하세요! 재미있게 게임해요",
    type: "DISCUSSION",
    timestamp: "2025-01-03T10:30:00Z"
  },
  {
    id: 2,
    gameNumber: 123,
    playerNickname: null,
    content: "게임이 시작되었습니다. 첫 번째 라운드를 시작합니다!",
    type: "SYSTEM",
    timestamp: "2025-01-03T10:31:00Z"
  },
  {
    id: 3,
    gameNumber: 123,
    playerNickname: "플레이어2",
    content: "네 다리가 있어요",
    type: "HINT",
    timestamp: "2025-01-03T10:32:00Z"
  }
]

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

export default function ComponentDemo() {
  const [selectedPlayer, setSelectedPlayer] = React.useState<number | undefined>()
  const [timeRemaining, setTimeRemaining] = React.useState(120)
  const [currentPhase, setCurrentPhase] = React.useState<GamePhase>('VOTING_FOR_LIAR')

  // 타이머 시뮬레이션
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleVote = (playerId: number) => {
    setSelectedPlayer(playerId)
    console.log('투표:', playerId)
  }

  const handleSubmitVote = async (data: any) => {
    console.log('투표 제출:', data)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const handleSendMessage = (content: string, type?: any) => {
    console.log('메시지 전송:', content, type)
  }

  const handleCreateGame = async (data: any) => {
    console.log('게임 생성:', data)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-background p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Main Version 컴포넌트 데모</h1>
            <Badge variant="secondary">개발 중</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIndicator status="online" showText />
            <Button variant="outline" size="sm">
              Light Version으로 전환
            </Button>
          </div>
        </motion.div>

        {/* 탭 네비게이션 */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="ui-components" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ui-components" className="flex items-center space-x-2">
                <Palette className="h-4 w-4" />
                <span>UI 컴포넌트</span>
              </TabsTrigger>
              <TabsTrigger value="game-components" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>게임 컴포넌트</span>
              </TabsTrigger>
              <TabsTrigger value="chat-system" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>채팅 시스템</span>
              </TabsTrigger>
              <TabsTrigger value="voting-system" className="flex items-center space-x-2">
                <Vote className="h-4 w-4" />
                <span>투표 시스템</span>
              </TabsTrigger>
              <TabsTrigger value="forms" className="flex items-center space-x-2">
                <GameController2 className="h-4 w-4" />
                <span>폼 컴포넌트</span>
              </TabsTrigger>
            </TabsList>

            {/* UI 컴포넌트 탭 */}
            <TabsContent value="ui-components" className="space-y-6">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>기본 UI 컴포넌트</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 버튼 데모 */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">버튼</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="default">기본</Button>
                        <Button variant="game-primary">게임 프라이머리</Button>
                        <Button variant="game-danger">게임 위험</Button>
                        <Button variant="outline">아웃라인</Button>
                        <Button variant="ghost">고스트</Button>
                        <Button loading>로딩 중</Button>
                      </div>
                    </div>

                    {/* 배지 데모 */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">배지</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="default">기본</Badge>
                        <Badge variant="liar">라이어</Badge>
                        <Badge variant="citizen">시민</Badge>
                        <Badge variant="online">온라인</Badge>
                        <Badge variant="offline">오프라인</Badge>
                        <Badge variant="waiting" pulse>대기중</Badge>
                      </div>
                    </div>

                    {/* 상태 표시기 데모 */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">상태 표시기</h3>
                      <div className="flex flex-wrap gap-4">
                        <StatusIndicator status="online" showText />
                        <StatusIndicator status="offline" showText />
                        <StatusIndicator status="away" showText />
                        <StatusIndicator status="playing" showText />
                      </div>
                    </div>

                    {/* 프로그레스 바 데모 */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">프로그레스 바</h3>
                      <div className="space-y-2">
                        <Progress value={75} color="default" />
                        <Progress value={60} color="success" />
                        <Progress value={30} color="warning" />
                        <Progress value={15} color="danger" animated />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* 게임 컴포넌트 탭 */}
            <TabsContent value="game-components" className="space-y-6">
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 플레이어 카드 데모 */}
                <Card>
                  <CardHeader>
                    <CardTitle>플레이어 카드</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">상세 모드</h4>
                      <PlayerCard
                        player={mockPlayers[0]}
                        variant="detailed"
                        showHint
                        showRole
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">투표 모드</h4>
                      <PlayerCard
                        player={mockPlayers[1]}
                        variant="voting"
                        interactive
                        selected={selectedPlayer === mockPlayers[1].id}
                        onVote={() => handleVote(mockPlayers[1].id)}
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">탈락 플레이어</h4>
                      <PlayerCard
                        player={mockPlayers[2]}
                        variant="detailed"
                        showRole
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 게임 진행 표시기 데모 */}
                <Card>
                  <CardHeader>
                    <CardTitle>게임 진행 표시기</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GamePhaseIndicator
                      currentPhase={currentPhase}
                      phases={[
                        { key: 'WAITING_FOR_PLAYERS', label: '대기', description: '플레이어 대기 중', color: 'bg-yellow-500' },
                        { key: 'SPEECH', label: '힌트', description: '힌트 제공 단계', color: 'bg-blue-500' },
                        { key: 'VOTING_FOR_LIAR', label: '투표', description: '라이어 지목 투표', color: 'bg-orange-500' },
                        { key: 'DEFENDING', label: '변론', description: '변론 단계', color: 'bg-purple-500' },
                        { key: 'VOTING_FOR_SURVIVAL', label: '최종투표', description: '처형/생존 투표', color: 'bg-red-500' },
                        { key: 'GAME_OVER', label: '종료', description: '게임 종료', color: 'bg-gray-500' }
                      ]}
                      timeRemaining={timeRemaining}
                      totalTime={180}
                      onPhaseClick={(phase) => setCurrentPhase(phase)}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* 채팅 시스템 탭 */}
            <TabsContent value="chat-system" className="space-y-6">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>채팅 시스템</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChatSystem
                      messages={mockMessages}
                      onSendMessage={handleSendMessage}
                      gameNumber={123}
                      currentPhase="투표 중"
                      timeRemaining={timeRemaining}
                      placeholder="메시지를 입력하세요..."
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* 투표 시스템 탭 */}
            <TabsContent value="voting-system" className="space-y-6">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>투표 시스템</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VotingPanel
                      players={mockPlayers.filter(p => p.isAlive)}
                      onSubmit={handleSubmitVote}
                      timeRemaining={timeRemaining}
                      totalTime={180}
                      votedPlayerId={selectedPlayer}
                      title="라이어 투표"
                      description="라이어로 의심되는 플레이어를 선택해주세요."
                      submitText="투표하기"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* 폼 컴포넌트 탭 */}
            <TabsContent value="forms" className="space-y-6">
              <motion.div variants={itemVariants}>
                <CreateGameForm
                  onSubmit={handleCreateGame}
                />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* 푸터 */}
        <motion.div variants={itemVariants} className="text-center text-muted-foreground">
          <p>Main Version 컴포넌트 데모 • Radix UI + shadcn/ui + Framer Motion</p>
        </motion.div>
      </div>
    </motion.div>
  )
}
