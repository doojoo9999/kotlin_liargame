import * as React from "react"
import {motion} from "framer-motion"
import {Button} from "@/versions/main/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {Avatar, AvatarFallback} from "@/versions/main/components/ui/avatar"
import {Input} from "@/versions/main/components/ui/input"
import {Progress} from "@/versions/main/components/ui/progress"
import {GameTimer} from "@/versions/main/components/features/GameTimer"
import {PlayerCard} from "@/versions/main/components/features/PlayerCard"
import {ChatSystem} from "@/versions/main/components/features/ChatSystem"
import {GameStatus} from "@/versions/main/components/features/GameStatus"

// Mock data for demo
const mockPlayers = [
  {
    id: "1",
    nickname: "플레이어1",
    isHost: true,
    isReady: true,
    role: "CITIZEN" as const,
    isAlive: true
  },
  {
    id: "2",
    nickname: "플레이어2",
    isReady: true,
    role: "LIAR" as const,
    isAlive: true,
    votedBy: 2
  },
  {
    id: "3",
    nickname: "플레이어3",
    isReady: false,
    isAlive: true
  },
  {
    id: "4",
    nickname: "플레이어4",
    isReady: true,
    isAlive: false
  },
]

const mockMessages = [
  {
    id: "1",
    content: "게임이 시작되었습니다!",
    sender: { id: "system", nickname: "시스템" },
    timestamp: Date.now() - 60000,
    type: "SYSTEM" as const
  },
  {
    id: "2",
    content: "안녕하세요! 잘 부탁드립니다.",
    sender: { id: "1", nickname: "플레이어1" },
    timestamp: Date.now() - 30000,
    type: "USER" as const
  },
  {
    id: "3",
    content: "화이팅해요!",
    sender: { id: "2", nickname: "플레이어2" },
    timestamp: Date.now() - 10000,
    type: "USER" as const
  },
]

export function ComponentDemoPage() {
  const [timerSeconds, setTimerSeconds] = React.useState(45)
  const [selectedPlayer, setSelectedPlayer] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState(mockMessages)

  // Timer demo
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev > 0 ? prev - 1 : 60)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = (message: string) => {
    const newMessage = {
      id: Date.now().toString(),
      content: message,
      sender: { id: "current", nickname: "현재 플레이어" },
      timestamp: Date.now(),
      type: "USER" as const
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleVote = (playerId: string) => {
    setSelectedPlayer(selectedPlayer === playerId ? null : playerId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-game-primary to-game-secondary bg-clip-text text-transparent">
            라이어 게임 Main Version
          </h1>
          <p className="text-lg text-muted-foreground">
            Radix UI + shadcn/ui + Framer Motion 컴포넌트 데모
          </p>
        </motion.div>

        {/* Basic UI Components Demo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>기본 UI 컴포넌트</CardTitle>
              <CardDescription>
                shadcn/ui 기반의 기본 컴포넌트들
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Buttons */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">버튼</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">기본</Button>
                  <Button variant="game-primary">게임 메인</Button>
                  <Button variant="game-danger">게임 위험</Button>
                  <Button variant="game-success">게임 성공</Button>
                  <Button variant="outline">아웃라인</Button>
                  <Button variant="ghost">고스트</Button>
                  <Button size="sm">작음</Button>
                  <Button size="lg">큼</Button>
                </div>
              </div>

              {/* Badges */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">뱃지</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="default">기본</Badge>
                  <Badge variant="role-citizen">시민</Badge>
                  <Badge variant="role-liar">라이어</Badge>
                  <Badge variant="game-primary">게임 메인</Badge>
                  <Badge variant="game-success">성공</Badge>
                  <Badge variant="game-warning">경고</Badge>
                  <Badge variant="game-danger">위험</Badge>
                  <Badge variant="status-online">온라인</Badge>
                  <Badge variant="status-offline">오프라인</Badge>
                </div>
              </div>

              {/* Avatars */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">아바타</h3>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>P1</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-game-primary text-white">P2</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-role-citizen text-white">P3</AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">진행 바</h3>
                <div className="space-y-2">
                  <Progress value={75} className="h-2" />
                  <Progress value={50} variant="game-timer" className="h-3" />
                  <Progress value={25} variant="game-danger" className="h-4" />
                  <Progress value={90} variant="game-success" className="h-2" />
                </div>
              </div>

              {/* Input */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">입력 필드</h3>
                <div className="space-y-2 max-w-md">
                  <Input placeholder="기본 입력 필드" />
                  <Input placeholder="비활성화된 필드" disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Game Components Demo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Game Timer */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">게임 타이머</h2>
            <GameTimer
              seconds={timerSeconds}
              totalSeconds={60}
              isRunning={true}
              showIcon={true}
            />
          </div>

          {/* Game Status */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">게임 상태</h2>
            <GameStatus
              phase="DISCUSSION"
              round={1}
              totalRounds={3}
              playersCount={4}
							timeRemaining={timerSeconds}
							totalTime={60}
							phase="DISCUSSION"
							isWarning={timerSeconds < 15}
            />
          </div>
        </motion.section>

        {/* Player Cards Demo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
							currentPhase="DISCUSSION"
							currentRound={1}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">플레이어 카드</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockPlayers.map((player, index) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentPlayer={index === 0}
                isVotingPhase={true}
                isSelected={selectedPlayer === player.id}
                onVote={handleVote}
                showRole={index < 2}
              />
            ))}
          </div>
        </motion.section>

        {/* Chat System Demo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">채팅 시스템</h2>
          <div className="max-w-2xl">
            <ChatSystem
              messages={messages}
              currentPlayer="현재 플레이어"
              onSendMessage={handleSendMessage}
              placeholder="메시지를 입력하세요..."
            />
          </div>
        </motion.section>

        {/* Animation Demo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">애니메이션 데모</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  className="p-4 bg-game-primary/10 rounded-lg text-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-game-primary font-semibold mb-2">호버 & 탭</div>
                  <div className="text-sm text-muted-foreground">마우스를 올리거나 클릭해보세요</div>
                </motion.div>

                <motion.div
                  className="p-4 bg-game-success/10 rounded-lg text-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="text-game-success font-semibold mb-2">회전</div>
                  <div className="text-sm text-muted-foreground">자동 회전 애니메이션</div>
                </motion.div>

                <motion.div
                  className="p-4 bg-game-warning/10 rounded-lg text-center"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="text-game-warning font-semibold mb-2">점프</div>
                  <div className="text-sm text-muted-foreground">상하 움직임</div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-8 text-muted-foreground"
        >
          <p>라이어 게임 Main Version - Phase 1 완료</p>
          <p className="text-sm mt-2">Radix UI + shadcn/ui + Tailwind CSS + Framer Motion</p>
        </motion.footer>
      </div>
    </div>
  )
}
