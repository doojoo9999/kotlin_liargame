import * as React from "react"
import {AnimatePresence, motion} from 'framer-motion'
import {Button} from '../components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '../components/ui/card'
import {Avatar, AvatarFallback} from '../components/ui/avatar'
import {Badge} from '../components/ui/badge'
import {Progress} from '../components/ui/progress'
import {Input} from '../components/ui/input'
import {Separator} from '../components/ui/separator'
import {Crown, MessageSquare, Send, Shield, Star, Target, Timer, Trophy, Users, Zap} from 'lucide-react'

interface GameMessage {
  id: number
  player: string
  message: string
  timestamp: string
  isOwn?: boolean
}

interface GamePlayer {
  id: number
  name: string
  role: 'CITIZEN' | 'LIAR' | 'UNKNOWN'
  isHost: boolean
  isAlive: boolean
  votesReceived: number
  score: number
}

export default function SimpleComponentDemo() {
  const [timeRemaining, setTimeRemaining] = React.useState(150)
  const [message, setMessage] = React.useState('')
  const [gamePhase, setGamePhase] = React.useState<'WAITING' | 'DISCUSSING' | 'VOTING' | 'REVEALING'>('VOTING')

  const [messages] = React.useState<GameMessage[]>([
    { id: 1, player: '플레이어1', message: '게임 시작하죠!', timestamp: '방금', isOwn: false },
    { id: 2, player: '플레이어2', message: '네, 준비됐습니다 🎮', timestamp: '30초 전', isOwn: false },
    { id: 3, player: '나', message: '화이팅!', timestamp: '10초 전', isOwn: true }
  ])

  const [players] = React.useState<GamePlayer[]>([
    { id: 1, name: '플레이어1', role: 'CITIZEN', isHost: true, isAlive: true, votesReceived: 2, score: 1250 },
    { id: 2, name: '플레이어2', role: 'UNKNOWN', isHost: false, isAlive: true, votesReceived: 0, score: 980 },
    { id: 3, name: '플레이어3', role: 'UNKNOWN', isHost: false, isAlive: true, votesReceived: 3, score: 1100 },
    { id: 4, name: '플레이어4', role: 'UNKNOWN', isHost: false, isAlive: false, votesReceived: 1, score: 750 }
  ])

  // 타이머 시뮬레이션
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : 150)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = () => {
    if (message.trim()) {
      // 메시지 전송 로직
      setMessage('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-500" />
                라이어 게임 Main Version - 컴포넌트 데모
                <Badge variant="secondary">Phase: {gamePhase}</Badge>
              </CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 플레이어 목록 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  플레이어 ({players.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.map((player) => (
                    <motion.div
                      key={player.id}
                      layout
                      className={`p-3 rounded-lg border ${
                        player.isAlive 
                          ? 'bg-white border-gray-200' 
                          : 'bg-gray-50 border-gray-300 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{player.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{player.name}</span>
                              {player.isHost && <Crown className="w-4 h-4 text-yellow-500" />}
                            </div>
                            <div className="text-sm text-gray-500">
                              점수: {player.score.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={player.role === 'CITIZEN' ? 'citizen' : player.role === 'LIAR' ? 'liar' : 'default'}
                            className="mb-1"
                          >
                            {player.role === 'CITIZEN' ? '시민' : player.role === 'LIAR' ? '라이어' : '???'}
                          </Badge>
                          {player.votesReceived > 0 && (
                            <div className="text-sm text-red-500">
                              투표: {player.votesReceived}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 중앙: 게임 영역 */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    게임 보드
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span className="text-sm">
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* 타이머 진행바 */}
                  <div>
                    <Progress value={(timeRemaining / 150) * 100} className="w-full" />
                    <div className="text-center mt-2 text-sm text-gray-600">
                      남은 시간: {timeRemaining}초
                    </div>
                  </div>

                  {/* 페이즈별 안내 */}
                  <motion.div
                    key={gamePhase}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
                  >
                    {gamePhase === 'VOTING' && (
                      <>
                        <Zap className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                        <h3 className="text-lg font-semibold mb-2">투표 시간</h3>
                        <p className="text-gray-600">
                          라이어라고 생각하는 플레이어에게 투표하세요
                        </p>
                      </>
                    )}
                  </motion.div>

                  {/* 액션 버튼들 */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full">
                      <Shield className="w-4 h-4 mr-2" />
                      패스
                    </Button>
                    <Button className="w-full">
                      <Star className="w-4 h-4 mr-2" />
                      투표
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 채팅 */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  채팅
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* 메시지 목록 */}
                <div className="flex-1 space-y-3 mb-4 overflow-auto">
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: msg.isOwn ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-lg ${
                            msg.isOwn
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {!msg.isOwn && (
                            <div className="text-xs font-medium mb-1">
                              {msg.player}
                            </div>
                          )}
                          <div className="text-sm">{msg.message}</div>
                          <div className={`text-xs mt-1 ${
                            msg.isOwn ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {msg.timestamp}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <Separator className="my-3" />

                {/* 메시지 입력 */}
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 하단: 기본 컴포넌트 테스트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>shadcn/ui 컴포넌트 테스트</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="default">기본 버튼</Button>
                <Button variant="secondary">보조 버튼</Button>
                <Button variant="outline">아웃라인</Button>
                <Button variant="destructive">위험 버튼</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
