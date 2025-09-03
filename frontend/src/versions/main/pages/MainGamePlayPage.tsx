import * as React from "react"
import {AnimatePresence, motion} from "framer-motion"
import {Button} from "@/versions/main/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {Avatar, AvatarFallback} from "@/versions/main/components/ui/avatar"
import {Input} from "@/versions/main/components/ui/input"
import {Progress} from "@/versions/main/components/ui/progress"
import {Separator} from "@/versions/main/components/ui/separator"
import {Clock, MessageSquare, Send, Trophy, Vote} from "lucide-react"

type GamePhase = 'WAITING' | 'DISCUSSING' | 'VOTING' | 'REVEALING' | 'FINISHED'
type PlayerRole = 'CITIZEN' | 'LIAR' | 'UNKNOWN'

interface GamePlayer {
  id: string
  nickname: string
  role: PlayerRole
  isAlive: boolean
  votesReceived: number
  hasVoted: boolean
}

interface GameMessage {
  id: string
  player: string
  message: string
  timestamp: string
  type: 'NORMAL' | 'SYSTEM' | 'VOTE'
}

const mockPlayers: GamePlayer[] = [
  { id: "1", nickname: "플레이어1", role: "CITIZEN", isAlive: true, votesReceived: 0, hasVoted: false },
  { id: "2", nickname: "플레이어2", role: "LIAR", isAlive: true, votesReceived: 2, hasVoted: true },
  { id: "3", nickname: "플레이어3", role: "CITIZEN", isAlive: true, votesReceived: 1, hasVoted: true },
  { id: "4", nickname: "플레이어4", role: "CITIZEN", isAlive: true, votesReceived: 0, hasVoted: false },
  { id: "5", nickname: "플레이어5", role: "CITIZEN", isAlive: true, votesReceived: 1, hasVoted: true }
]

const mockMessages: GameMessage[] = [
  { id: "1", player: "System", message: "게임이 시작되었습니다! 주제어는 '동물'입니다.", timestamp: "14:30", type: "SYSTEM" },
  { id: "2", player: "플레이어1", message: "이것은 털이 있고 네 발로 걸어다녀요", timestamp: "14:31", type: "NORMAL" },
  { id: "3", player: "플레이어2", message: "집에서 기를 수 있고 사람과 친해요", timestamp: "14:32", type: "NORMAL" }
]

export default function MainGamePlayPage() {
  const [gamePhase, setGamePhase] = React.useState<GamePhase>('DISCUSSING')
  const [timeRemaining, setTimeRemaining] = React.useState(120) // 2분
  const [message, setMessage] = React.useState("")
  const [messages, setMessages] = React.useState(mockMessages)
  const [selectedVote, setSelectedVote] = React.useState<string | null>(null)
  const [currentWord, setCurrentWord] = React.useState("강아지")
  const [isLiar] = React.useState(false) // 현재 플레이어가 라이어인지
  const currentPlayer = mockPlayers[0]

  // 타이머 효과
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // 시간 종료 시 다음 페이즈로
          if (gamePhase === 'DISCUSSING') {
            setGamePhase('VOTING')
            return 60 // 투표 시간 1분
          } else if (gamePhase === 'VOTING') {
            setGamePhase('REVEALING')
            return 10 // 결과 공개 10초
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gamePhase])

  const handleSendMessage = () => {
    if (message.trim() && gamePhase === 'DISCUSSING') {
      const newMessage: GameMessage = {
        id: Date.now().toString(),
        player: currentPlayer.nickname,
        message: message.trim(),
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        type: 'NORMAL'
      }
      setMessages(prev => [...prev, newMessage])
      setMessage("")
    }
  }

  const handleVote = (playerId: string) => {
    if (gamePhase === 'VOTING' && !currentPlayer.hasVoted) {
      setSelectedVote(playerId)
    }
  }

  const confirmVote = () => {
    if (selectedVote && gamePhase === 'VOTING') {
      const voteMessage: GameMessage = {
        id: Date.now().toString(),
        player: "System",
        message: `${currentPlayer.nickname}이 투표했습니다.`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        type: 'VOTE'
      }
      setMessages(prev => [...prev, voteMessage])
      // 실제로는 서버에 투표 전송
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPhaseColor = () => {
    switch (gamePhase) {
      case 'DISCUSSING': return 'blue'
      case 'VOTING': return 'red'
      case 'REVEALING': return 'purple'
      default: return 'gray'
    }
  }

  const getPhaseText = () => {
    switch (gamePhase) {
      case 'DISCUSSING': return '토론 시간'
      case 'VOTING': return '투표 시간'
      case 'REVEALING': return '결과 공개'
      default: return '대기 중'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 게임 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge variant="game-primary" className="text-lg px-4 py-2">
              {getPhaseText()}
            </Badge>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Clock className="w-6 h-6" />
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* 주제어 표시 */}
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-600 mb-2">
                {isLiar ? "당신은 라이어입니다!" : "주제어"}
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {isLiar ? "???" : currentWord}
              </div>
              {isLiar && (
                <div className="text-sm text-red-600 mt-2">
                  다른 플레이어들의 설명을 듣고 주제어를 추리하세요
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 플레이어 카드들 */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {mockPlayers.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className={`cursor-pointer transition-all ${
                    selectedVote === player.id ? 'ring-2 ring-red-500' : ''
                  }`}
                  onClick={() => handleVote(player.id)}
                >
                  <Card className={`${gamePhase === 'VOTING' && player.id !== currentPlayer.id ? 'hover:shadow-lg' : ''}`}>
                    <CardContent className="p-4 text-center">
                      <Avatar className="mx-auto mb-2">
                        <AvatarFallback>{player.nickname[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm font-medium mb-2">{player.nickname}</div>

                      {gamePhase === 'REVEALING' && (
                        <Badge
                          variant={player.role === 'LIAR' ? 'role-liar' : 'role-citizen'}
                          className="mb-2"
                        >
                          {player.role === 'LIAR' ? '라이어' : '시민'}
                        </Badge>
                      )}

                      {gamePhase === 'VOTING' && (
                        <div className="text-xs text-gray-600">
                          투표 {player.votesReceived}표
                          {player.hasVoted && (
                            <div className="text-green-600">✓ 투표완료</div>
                          )}
                        </div>
                      )}

                      {gamePhase === 'VOTING' && player.id !== currentPlayer.id && (
                        <Button
                          size="sm"
                          variant={selectedVote === player.id ? 'game-danger' : 'outline'}
                          className="w-full mt-2"
                        >
                          <Vote className="w-3 h-3 mr-1" />
                          투표
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* 투표 확인 버튼 */}
            {gamePhase === 'VOTING' && selectedVote && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
              >
                <Button
                  onClick={confirmVote}
                  variant="game-danger"
                  size="lg"
                  className="px-8"
                >
                  {mockPlayers.find(p => p.id === selectedVote)?.nickname}에게 투표하기
                </Button>
              </motion.div>
            )}

            {/* 게임 진행 상황 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  게임 진행 상황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>시간 진행</span>
                      <span>{formatTime(timeRemaining)}</span>
                    </div>
                    <Progress
                      value={(timeRemaining / 120) * 100}
                      className="h-2"
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {mockPlayers.filter(p => p.hasVoted).length}
                      </div>
                      <div className="text-sm text-gray-600">투표 완료</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {mockPlayers.length}
                      </div>
                      <div className="text-sm text-gray-600">전체 플레이어</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 채팅 */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  게임 채팅
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-2 rounded text-sm ${
                          msg.type === 'SYSTEM'
                            ? "bg-gray-100 text-gray-600 text-center"
                            : msg.type === 'VOTE'
                            ? "bg-red-100 text-red-700 text-center"
                            : msg.player === currentPlayer.nickname
                            ? "bg-blue-500 text-white ml-auto max-w-[80%]"
                            : "bg-white border max-w-[80%]"
                        }`}
                      >
                        {msg.type === 'NORMAL' && (
                          <div className="text-xs opacity-70 mb-1">
                            {msg.player} · {msg.timestamp}
                          </div>
                        )}
                        <div>{msg.message}</div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {gamePhase === 'DISCUSSING' && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="힌트를 말해주세요..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {gamePhase === 'VOTING' && (
                  <div className="text-center text-sm text-gray-600 p-4">
                    투표 시간입니다!<br />
                    라이어라고 생각하는 플레이어를 선택하세요.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
