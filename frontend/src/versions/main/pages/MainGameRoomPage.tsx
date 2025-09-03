import * as React from "react"
import {motion} from "framer-motion"
import {Button} from "@/versions/main/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {Avatar, AvatarFallback} from "@/versions/main/components/ui/avatar"
import {Input} from "@/versions/main/components/ui/input"
import {Separator} from "@/versions/main/components/ui/separator"
import {Crown, LogOut, MessageSquare, Play, Send, Settings} from "lucide-react"

interface GameRoomPlayer {
  id: string
  nickname: string
  isHost: boolean
  isReady: boolean
  avatar?: string
}

interface ChatMessage {
  id: string
  player: string
  message: string
  timestamp: string
  isSystem?: boolean
}

const mockPlayers: GameRoomPlayer[] = [
  { id: "1", nickname: "플레이어1", isHost: true, isReady: true },
  { id: "2", nickname: "플레이어2", isHost: false, isReady: true },
  { id: "3", nickname: "플레이어3", isHost: false, isReady: false },
  { id: "4", nickname: "플레이어4", isHost: false, isReady: true }
]

const mockMessages: ChatMessage[] = [
  { id: "1", player: "플레이어1", message: "안녕하세요! 게임 시작하죠", timestamp: "14:30" },
  { id: "2", player: "System", message: "플레이어2가 준비 완료했습니다.", timestamp: "14:31", isSystem: true },
  { id: "3", player: "플레이어2", message: "준비됐습니다!", timestamp: "14:31" }
]

export default function MainGameRoomPage() {
  const [message, setMessage] = React.useState("")
  const [messages, setMessages] = React.useState(mockMessages)
  const [isReady, setIsReady] = React.useState(false)
  const currentPlayer = mockPlayers[1] // 현재 플레이어는 두번째 플레이어라고 가정

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        player: currentPlayer.nickname,
        message: message.trim(),
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, newMessage])
      setMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleReady = () => {
    setIsReady(!isReady)
  }

  const canStartGame = mockPlayers.filter(p => p.isReady).length >= 3

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">초보자 방</h1>
            <p className="text-gray-600">라이어를 찾아라! · 플레이어 {mockPlayers.length}/8</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              설정
            </Button>
            <Button variant="destructive">
              <LogOut className="w-4 h-4 mr-2" />
              나가기
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 플레이어 목록 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  플레이어 목록
                </CardTitle>
                <CardDescription>
                  게임 시작까지 최소 3명이 필요합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mockPlayers.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between p-4 border rounded-lg bg-white/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{player.nickname[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{player.nickname}</span>
                            {player.isHost && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {player.id === currentPlayer.id ? "나" : "플레이어"}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={player.isReady ? "game-success" : "game-warning"}
                      >
                        {player.isReady ? "준비완료" : "대기중"}
                      </Badge>
                    </motion.div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* 게임 시작 버튼 */}
                <div className="space-y-3">
                  <Button
                    onClick={toggleReady}
                    variant={isReady ? "game-warning" : "game-success"}
                    className="w-full"
                  >
                    {isReady ? "준비 해제" : "준비 완료"}
                  </Button>

                  {currentPlayer.isHost && (
                    <Button
                      variant="game-primary"
                      className="w-full"
                      disabled={!canStartGame}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      게임 시작 ({mockPlayers.filter(p => p.isReady).length}/3)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 채팅 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  채팅
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* 메시지 목록 */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.isSystem
                          ? "bg-gray-100 text-gray-600 text-sm text-center"
                          : msg.player === currentPlayer.nickname
                          ? "bg-blue-500 text-white ml-auto max-w-[80%]"
                          : "bg-white border max-w-[80%]"
                      }`}
                    >
                      {!msg.isSystem && (
                        <div className="text-xs opacity-70 mb-1">
                          {msg.player} · {msg.timestamp}
                        </div>
                      )}
                      <div>{msg.message}</div>
                    </div>
                  ))}
                </div>

                {/* 메시지 입력 */}
                <div className="flex gap-2">
                  <Input
                    placeholder="메시지를 입력하세요..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
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
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
